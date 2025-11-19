using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using DocumentService.Application.Interfaces;
using DocumentService.Domain.Aggregates;

namespace DocumentService.Application.Commands;

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, UploadDocumentResult>
{
    private readonly IDocumentRepository _repository;
    private readonly IObjectStorage _objectStorage;
    private readonly IVirusScanner _virusScanner;
    private readonly IContentHashDeduplicator _deduplicator;
    private readonly ILogger<UploadDocumentCommandHandler> _logger;
    private readonly IConfiguration _configuration;

    public UploadDocumentCommandHandler(
        IDocumentRepository repository,
        IObjectStorage objectStorage,
        IVirusScanner virusScanner,
        IContentHashDeduplicator deduplicator,
        IConfiguration configuration,
        ILogger<UploadDocumentCommandHandler> logger)
    {
        _repository = repository;
        _objectStorage = objectStorage;
        _virusScanner = virusScanner;
        _deduplicator = deduplicator;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<UploadDocumentResult> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Processing document upload for file: {FileName}", request.FileName);

            // Generate content hash
            var contentHash = await _deduplicator.ComputeHashAsync(request.FileStream, cancellationToken);
            
            // Check for duplicates
            var duplicateCheck = await _deduplicator.CheckForDuplicateAsync(contentHash, request.CaseId, cancellationToken);
            if (duplicateCheck.IsDuplicate)
            {
                _logger.LogInformation("Duplicate document found for hash: {ContentHash}", contentHash);
                return new UploadDocumentResult
                {
                    DocumentId = duplicateCheck.ExistingDocumentId ?? Guid.Empty,
                    DocumentNumber = string.Empty,
                    WasDuplicate = true,
                    ExistingDocumentId = duplicateCheck.ExistingDocumentId,
                    StorageKey = string.Empty
                };
            }

            // Scan for viruses
            var virusScanResult = await _virusScanner.ScanAsync(request.FileStream, cancellationToken);
            if (!virusScanResult.IsClean)
            {
                _logger.LogWarning("Virus detected in file: {FileName}, Virus: {VirusName}", 
                    request.FileName, virusScanResult.VirusName);
                return new UploadDocumentResult
                {
                    DocumentId = Guid.Empty,
                    DocumentNumber = string.Empty,
                    WasDuplicate = false,
                    ExistingDocumentId = null,
                    StorageKey = string.Empty
                };
            }

            // Generate object key
            var objectKey = $"documents/{request.CaseId}/{Guid.NewGuid()}/{request.FileName}";
            // Use configured bucket name (defaults to "kyb-docs" from configuration)
            var bucketName = _configuration["Storage:BucketName"] ?? "kyb-docs";
            _logger.LogInformation("Using bucket: {BucketName} for upload", bucketName);

            // Reset stream position for upload (it may have been read for hash/virus scan)
            if (request.FileStream.CanSeek)
            {
                request.FileStream.Position = 0;
            }

            // Upload file to object storage
            await _objectStorage.UploadObjectAsync(
                bucketName,
                objectKey,
                request.FileStream,
                request.ContentType,
                new Dictionary<string, string>
                {
                    ["CaseId"] = request.CaseId.ToString(),
                    ["FileName"] = request.FileName,
                    ["ContentHash"] = contentHash
                },
                cancellationToken);

            // Create document entity
            var document = Document.Create(
                request.CaseId,
                request.PartnerId,
                request.Type,
                request.FileName,
                request.ContentType,
                request.FileSizeBytes,
                objectKey,
                bucketName,
                request.Metadata,
                request.UploadedBy);

            // Save to database
            await _repository.AddAsync(document, cancellationToken);
            await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

            // Register hash for deduplication
            await _deduplicator.RegisterDocumentHashAsync(document.Id, contentHash, request.CaseId, cancellationToken);

            _logger.LogInformation("Document uploaded successfully: {DocumentId}, FileName: {FileName}", 
                document.Id, request.FileName);

            return new UploadDocumentResult
            {
                DocumentId = document.Id,
                DocumentNumber = document.DocumentNumber,
                WasDuplicate = false,
                ExistingDocumentId = null,
                StorageKey = objectKey
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document: {FileName}", request.FileName);
            return new UploadDocumentResult
            {
                DocumentId = Guid.Empty,
                DocumentNumber = string.Empty,
                WasDuplicate = false,
                ExistingDocumentId = null,
                StorageKey = string.Empty
            };
        }
    }
}
