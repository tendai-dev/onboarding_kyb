using DocumentService.Application.Interfaces;
using DocumentService.Domain.Aggregates;
using DocumentService.Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace DocumentService.Application.Commands;

/// <summary>
/// Handler for bulk document import
/// Processes documents in batches with error handling and audit trail
/// </summary>
public class BulkImportDocumentsCommandHandler : IRequestHandler<BulkImportDocumentsCommand, BulkImportResult>
{
    private readonly IDocumentRepository _repository;
    private readonly IObjectStorage _objectStorage;
    private readonly IVirusScanner _virusScanner;
    private readonly IContentHashDeduplicator _deduplicator;
    private readonly ILogger<BulkImportDocumentsCommandHandler> _logger;

    public BulkImportDocumentsCommandHandler(
        IDocumentRepository repository,
        IObjectStorage objectStorage,
        IVirusScanner virusScanner,
        IContentHashDeduplicator deduplicator,
        ILogger<BulkImportDocumentsCommandHandler> logger)
    {
        _repository = repository;
        _objectStorage = objectStorage;
        _virusScanner = virusScanner;
        _deduplicator = deduplicator;
        _logger = logger;
    }

    public async Task<BulkImportResult> Handle(
        BulkImportDocumentsCommand request,
        CancellationToken cancellationToken)
    {
        var startedAt = DateTime.UtcNow;
        
        _logger.LogInformation(
            "Starting bulk import batch {BatchId} with {Count} documents from {Source}",
            request.ImportBatchId, request.Documents.Count, request.ImportSource);

        var result = new BulkImportResult
        {
            ImportBatchId = request.ImportBatchId,
            TotalDocuments = request.Documents.Count,
            StartedAt = startedAt,
            Errors = new List<ImportError>()
        };

        var successCount = 0;
        var failureCount = 0;
        var duplicateCount = 0;

        // Process documents in parallel batches of 10
        var batches = request.Documents
            .Select((doc, index) => new { doc, index })
            .GroupBy(x => x.index / 10)
            .Select(g => g.Select(x => x.doc).ToList());

        foreach (var batch in batches)
        {
            var tasks = batch.Select(async doc =>
            {
                try
                {
                    var imported = await ImportSingleDocumentAsync(doc, request, cancellationToken);
                    
                    if (imported.IsDuplicate)
                    {
                        Interlocked.Increment(ref duplicateCount);
                    }
                    else
                    {
                        Interlocked.Increment(ref successCount);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to import document {LegacyId} from {FilePath}",
                        doc.LegacyDocumentId, doc.FilePath);

                    result.Errors.Add(new ImportError
                    {
                        LegacyDocumentId = doc.LegacyDocumentId,
                        FilePath = doc.FilePath,
                        ErrorMessage = ex.Message
                    });

                    Interlocked.Increment(ref failureCount);
                }
            });

            await Task.WhenAll(tasks);

            _logger.LogInformation(
                "Batch import progress: {Success} success, {Failure} failed, {Duplicate} duplicates",
                successCount, failureCount, duplicateCount);
        }

        result.SuccessCount = successCount;
        result.FailureCount = failureCount;
        result.DuplicateCount = duplicateCount;
        result.CompletedAt = DateTime.UtcNow;

        _logger.LogInformation(
            "Bulk import batch {BatchId} completed in {Duration}s: {Success} success, {Failure} failed, {Duplicate} duplicates",
            request.ImportBatchId,
            (result.CompletedAt - result.StartedAt).TotalSeconds,
            successCount, failureCount, duplicateCount);

        // Create audit log entry for bulk import
        await AuditBulkImportAsync(request, result, cancellationToken);

        return result;
    }

    private async Task<ImportDocumentResult> ImportSingleDocumentAsync(
        DocumentImportEntry entry,
        BulkImportDocumentsCommand command,
        CancellationToken cancellationToken)
    {
        // Read file from legacy storage
        await using var fileStream = File.OpenRead(entry.FilePath);
        
        // Compute content hash
        var contentHash = await _deduplicator.ComputeHashAsync(fileStream, cancellationToken);
        
        // Check for duplicates
        var duplicateCheck = await _deduplicator.CheckForDuplicateAsync(
            contentHash,
            entry.CaseId,
            cancellationToken);

        if (duplicateCheck.IsDuplicate && duplicateCheck.CanReuse)
        {
            _logger.LogInformation(
                "Skipping duplicate document {LegacyId} (hash: {Hash}, existing: {ExistingId})",
                entry.LegacyDocumentId, contentHash, duplicateCheck.ExistingDocumentId);

            return new ImportDocumentResult
            {
                IsDuplicate = true,
                ExistingDocumentId = duplicateCheck.ExistingDocumentId
            };
        }

        // Detect MIME type
        fileStream.Position = 0;
        var contentType = DetectMimeType(fileStream, entry.FileName);

        // Virus scan
        fileStream.Position = 0;
        var scanResult = await _virusScanner.ScanAsync(fileStream, cancellationToken);

        if (!scanResult.IsClean)
        {
            throw new VirusScanException($"Virus detected: {scanResult.VirusName}");
        }

        // Upload to MinIO
        fileStream.Position = 0;
        var storageKey = $"imports/{command.ImportBatchId}/{entry.LegacyDocumentId}/{entry.FileName}";
        var bucketName = "documents";

        // Upload implementation here...

        // Create document record
        var metadata = new DocumentMetadata
        {
            Description = $"Imported from {command.ImportSource}",
            Tags = new Dictionary<string, string>
            {
                ["legacy_id"] = entry.LegacyDocumentId,
                ["import_batch_id"] = command.ImportBatchId.ToString(),
                ["import_source"] = command.ImportSource,
                ["content_hash"] = contentHash
            }
        };

        foreach (var kvp in entry.Metadata)
        {
            metadata.Tags[kvp.Key] = kvp.Value;
        }

        var document = Document.Create(
            entry.CaseId,
            Guid.Empty,  // Partner ID from case
            entry.Type,
            entry.FileName,
            contentType,
            fileStream.Length,
            storageKey,
            bucketName,
            metadata,
            command.ImportedBy
        );

        // Mark as virus scanned
        document.MarkVirusScanned(isClean: true);

        await _repository.AddAsync(document, cancellationToken);
        await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        // Register content hash
        await _deduplicator.RegisterDocumentHashAsync(
            document.Id,
            contentHash,
            entry.CaseId,
            cancellationToken);

        return new ImportDocumentResult
        {
            IsDuplicate = false,
            DocumentId = document.Id
        };
    }

    private static string DetectMimeType(Stream stream, string fileName)
    {
        // Read file signature (magic bytes)
        var buffer = new byte[16];
        stream.Read(buffer, 0, 16);
        stream.Position = 0;

        // PDF
        if (buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46)
            return "application/pdf";

        // PNG
        if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47)
            return "image/png";

        // JPEG
        if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
            return "image/jpeg";

        // Fallback to extension
        var ext = Path.GetExtension(fileName).ToLower();
        return ext switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => "application/octet-stream"
        };
    }

    private async Task AuditBulkImportAsync(
        BulkImportDocumentsCommand command,
        BulkImportResult result,
        CancellationToken cancellationToken)
    {
        var auditEntry = new
        {
            import_batch_id = command.ImportBatchId,
            import_source = command.ImportSource,
            imported_by = command.ImportedBy,
            total_documents = result.TotalDocuments,
            success_count = result.SuccessCount,
            failure_count = result.FailureCount,
            duplicate_count = result.DuplicateCount,
            started_at = result.StartedAt,
            completed_at = result.CompletedAt,
            duration_seconds = (result.CompletedAt - result.StartedAt).TotalSeconds,
            errors = result.Errors,
            metadata = command.Metadata
        };

        _logger.LogInformation(
            "BULK_IMPORT_AUDIT: {@Audit}",
            auditEntry);

        // Store in audit log table
        // await _auditRepository.AddAsync(auditEntry, cancellationToken);
    }

    private class ImportDocumentResult
    {
        public bool IsDuplicate { get; set; }
        public Guid? DocumentId { get; set; }
        public Guid? ExistingDocumentId { get; set; }
    }
}

public interface IVirusScanner
{
    Task<VirusScanResult> ScanAsync(Stream fileStream, CancellationToken cancellationToken = default);
}

public class VirusScanResult
{
    public bool IsClean { get; set; }
    public string? VirusName { get; set; }
    public DateTime ScanCompletedAt { get; set; }
}

public class VirusScanException : Exception
{
    public VirusScanException(string message) : base(message) { }
}

public interface IContentHashDeduplicator
{
    Task<string> ComputeHashAsync(Stream stream, CancellationToken cancellationToken = default);
    Task<DuplicateCheckResult> CheckForDuplicateAsync(string contentHash, Guid caseId, CancellationToken cancellationToken = default);
    Task RegisterDocumentHashAsync(Guid documentId, string contentHash, Guid caseId, CancellationToken cancellationToken = default);
}

public class DuplicateCheckResult
{
    public bool IsDuplicate { get; set; }
    public Guid? ExistingDocumentId { get; set; }
    public Guid? ExistingCaseId { get; set; }
    public bool CanReuse { get; set; }
}

