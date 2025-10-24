using System.Diagnostics;
using DocumentService.Application.Interfaces;
using DocumentService.Domain.Aggregates;
using DocumentService.Infrastructure.AntiVirus;
using DocumentService.Infrastructure.Storage;
using Microsoft.Extensions.Logging;

namespace DocumentService.Infrastructure.Services;

/// <summary>
/// Orchestrates complete document validation pipeline
/// </summary>
public class DocumentValidationService : IDocumentValidationService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IStorageService _storageService;
    private readonly IClamAvClient _clamAvClient;
    private readonly IDocumentQualityValidator _qualityValidator;
    private readonly ILogger<DocumentValidationService> _logger;
    
    public DocumentValidationService(
        IDocumentRepository documentRepository,
        IStorageService storageService,
        IClamAvClient clamAvClient,
        IDocumentQualityValidator qualityValidator,
        ILogger<DocumentValidationService> logger)
    {
        _documentRepository = documentRepository;
        _storageService = storageService;
        _clamAvClient = clamAvClient;
        _qualityValidator = qualityValidator;
        _logger = logger;
    }
    
    public async Task<ValidationResult> ValidateDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var errors = new List<string>();
        var warnings = new List<string>();
        
        try
        {
            _logger.LogInformation("Starting validation pipeline for document: {DocumentId}", documentId);
            
            // 1. Retrieve document from repository
            var document = await _documentRepository.GetByIdAsync(documentId, cancellationToken);
            if (document == null)
            {
                errors.Add($"Document not found: {documentId}");
                return CreateFailureResult(errors, warnings, stopwatch.Elapsed);
            }
            
            // 2. Download document from storage
            _logger.LogInformation(
                "Downloading document from storage: {StorageKey}",
                document.StorageKey);
                
            await using var documentStream = await _storageService.DownloadAsync(
                document.BucketName,
                document.StorageKey,
                cancellationToken);
            
            if (documentStream == null || documentStream.Length == 0)
            {
                errors.Add("Failed to download document from storage");
                return CreateFailureResult(errors, warnings, stopwatch.Elapsed);
            }
            
            // 3. Virus scanning
            _logger.LogInformation("Step 1: Virus scanning for document: {DocumentId}", documentId);
            ScanResult? scanResult = null;
            
            try
            {
                scanResult = await _clamAvClient.ScanAsync(
                    documentStream,
                    document.FileName,
                    cancellationToken);
                
                // Update document with scan result
                document.MarkVirusScanned(scanResult.IsClean);
                await _documentRepository.UpdateAsync(document, cancellationToken);
                
                if (!scanResult.IsClean)
                {
                    errors.Add($"Virus detected: {scanResult.VirusName}");
                    
                    _logger.LogWarning(
                        "Document {DocumentId} failed virus scan: {VirusName}",
                        documentId, scanResult.VirusName);
                    
                    stopwatch.Stop();
                    return new ValidationResult
                    {
                        Passed = false,
                        VirusScanned = true,
                        IsVirusClean = false,
                        VirusName = scanResult.VirusName,
                        ValidationErrors = errors,
                        TotalDuration = stopwatch.Elapsed
                    };
                }
                
                _logger.LogInformation(
                    "Document {DocumentId} passed virus scan (Duration: {Duration}ms)",
                    documentId, scanResult.ScanDuration.TotalMilliseconds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Virus scanning failed for document: {DocumentId}", documentId);
                errors.Add($"Virus scanning error: {ex.Message}");
                return CreateFailureResult(errors, warnings, stopwatch.Elapsed);
            }
            
            // 4. Quality validation
            _logger.LogInformation("Step 2: Quality validation for document: {DocumentId}", documentId);
            DocumentQualityResult? qualityResult = null;
            
            try
            {
                // Reset stream position
                documentStream.Position = 0;
                
                qualityResult = await _qualityValidator.ValidateAsync(
                    documentStream,
                    document.FileName,
                    document.Type.ToString(),
                    cancellationToken);
                
                if (!qualityResult.IsAcceptable)
                {
                    foreach (var issue in qualityResult.Issues)
                    {
                        warnings.Add($"{issue.Type}: {issue.Description}");
                    }
                    
                    _logger.LogWarning(
                        "Document {DocumentId} has quality issues: Score={Score}, Issues={IssueCount}",
                        documentId, qualityResult.QualityScore, qualityResult.Issues.Count);
                    
                    // Quality issues are warnings, not hard failures (configurable)
                    // In strict mode, these could be errors instead
                }
                else
                {
                    _logger.LogInformation(
                        "Document {DocumentId} passed quality validation (Score: {Score})",
                        documentId, qualityResult.QualityScore);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Quality validation failed for document: {DocumentId}", documentId);
                warnings.Add($"Quality validation error: {ex.Message}");
                // Continue - quality validation failure is not critical
            }
            
            // 5. Final result
            stopwatch.Stop();
            
            var passed = errors.Count == 0;
            
            _logger.LogInformation(
                "Validation pipeline completed for document {DocumentId}: Passed={Passed}, Duration={Duration}ms",
                documentId, passed, stopwatch.ElapsedMilliseconds);
            
            return new ValidationResult
            {
                Passed = passed,
                VirusScanned = scanResult != null,
                IsVirusClean = scanResult?.IsClean ?? false,
                VirusName = scanResult?.VirusName,
                QualityChecked = qualityResult != null,
                QualityScore = qualityResult?.QualityScore,
                ValidationErrors = errors,
                ValidationWarnings = warnings,
                TotalDuration = stopwatch.Elapsed
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Unexpected error in validation pipeline for document: {DocumentId}", documentId);
            errors.Add($"Validation pipeline error: {ex.Message}");
            return CreateFailureResult(errors, warnings, stopwatch.Elapsed);
        }
    }
    
    private ValidationResult CreateFailureResult(
        List<string> errors,
        List<string> warnings,
        TimeSpan duration)
    {
        return new ValidationResult
        {
            Passed = false,
            ValidationErrors = errors,
            ValidationWarnings = warnings,
            TotalDuration = duration
        };
    }
}

/// <summary>
/// Document repository interface (assumed to exist)
/// </summary>
public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task UpdateAsync(Document document, CancellationToken cancellationToken = default);
}

/// <summary>
/// Storage service interface (assumed to exist)
/// </summary>
public interface IStorageService
{
    Task<Stream?> DownloadAsync(string bucketName, string key, CancellationToken cancellationToken = default);
}

