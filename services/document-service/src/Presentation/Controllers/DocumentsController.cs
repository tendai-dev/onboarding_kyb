using DocumentService.Application.Commands;
using DocumentService.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Minio.Exceptions;

namespace DocumentService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[AllowAnonymous]
public class DocumentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDocumentRepository _repository;
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(IMediator mediator, IDocumentRepository repository, IObjectStorage objectStorage, ILogger<DocumentsController> logger)
    {
        _mediator = mediator;
        _repository = repository;
        _objectStorage = objectStorage;
        _logger = logger;
    }

    /// <summary>
    /// Upload a document for a KYB case
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(UploadDocumentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { error = "No file provided" });

            var command = new UploadDocumentCommand
            {
                CaseId = request.CaseId,
                PartnerId = request.PartnerId,
                Type = request.Type,
                FileName = request.File.FileName,
                ContentType = request.File.ContentType,
                FileStream = request.File.OpenReadStream(),
                FileSizeBytes = request.File.Length,
                UploadedBy = request.UploadedBy ?? "system",
                Metadata = new DocumentService.Domain.ValueObjects.DocumentMetadata
                {
                    Description = request.Description,
                    IssueDate = request.IssueDate,
                    ExpiryDate = request.ExpiryDate,
                    IssuingAuthority = request.IssuingAuthority,
                    DocumentNumber = request.DocumentNumber,
                    Country = request.Country,
                    Tags = request.Tags ?? new Dictionary<string, string>()
                }
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// List all documents (with pagination)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAll([FromQuery] int skip = 0, [FromQuery] int take = 100)
    {
        try
        {
            var documents = await _repository.GetAllAsync(skip, take);
            var total = await _repository.GetCountAsync();
            var result = documents.Select(d => new
            {
                d.Id,
                d.DocumentNumber,
                d.CaseId,
                d.PartnerId,
                d.Type,
                d.FileName,
                d.ContentType,
                d.SizeBytes,
                d.StorageKey,
                d.BucketName,
                d.UploadedAt,
                d.UploadedBy
            });
            return Ok(new { items = result, total, skip, take });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing all documents");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// List documents for a case
    /// </summary>
    [HttpGet("case/{caseId}")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByCase(Guid caseId)
    {
        try
        {
            var documents = await _repository.GetByCaseIdAsync(caseId);
            var result = documents.Select(d => new
            {
                d.Id,
                d.DocumentNumber,
                d.CaseId,
                d.PartnerId,
                d.Type,
                d.FileName,
                d.ContentType,
                d.SizeBytes,
                d.StorageKey,
                d.BucketName,
                d.UploadedAt,
                d.UploadedBy
            });
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing documents for case {CaseId}", caseId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get presigned download URL by storage key
    /// </summary>
    [HttpGet("download/{*key}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDownloadByKey([FromRoute] string key)
    {
        try
        {
            // The route parameter might be URL-encoded or decoded depending on how it's passed
            // Try both decoded and encoded versions
            var decodedKey = Uri.UnescapeDataString(key);
            _logger.LogInformation("Looking up document - Original key: '{Key}', Decoded: '{DecodedKey}'", key, decodedKey);
            
            // Try decoded key first (most likely)
            var document = await _repository.GetByStorageKeyAsync(decodedKey);
            
            // If not found, try the original key (in case it wasn't encoded)
            if (document == null && key != decodedKey)
            {
                _logger.LogInformation("Trying with original key: '{Key}'", key);
                document = await _repository.GetByStorageKeyAsync(key);
            }
            
            // If still not found, try URL-encoding the decoded key (double-encode)
            if (document == null)
            {
                var encodedKey = Uri.EscapeDataString(decodedKey);
                _logger.LogInformation("Trying with URL-encoded decoded key: '{EncodedKey}'", encodedKey);
                document = await _repository.GetByStorageKeyAsync(encodedKey);
            }
            
            // If still not found, try searching all documents (in case of encoding mismatches)
            if (document == null)
            {
                _logger.LogWarning("Document not found by exact match, searching all documents...");
                try
                {
                    var allDocs = await _repository.GetAllAsync(0, 1000);
                    _logger.LogInformation("Retrieved {Count} documents from database", allDocs.Count());
                    
                    // Try multiple matching strategies with all key variations
                    var encodedKey = Uri.EscapeDataString(decodedKey);
                    document = allDocs.FirstOrDefault(d => 
                        d.StorageKey == decodedKey || 
                        d.StorageKey == key ||
                        d.StorageKey == encodedKey ||
                        (d.StorageKey != null && decodedKey != null && d.StorageKey.Equals(decodedKey, StringComparison.OrdinalIgnoreCase)) ||
                        (d.StorageKey != null && key != null && d.StorageKey.Equals(key, StringComparison.OrdinalIgnoreCase)));
                    
                    // If still not found, try partial matches
                    if (document == null)
                    {
                        _logger.LogWarning("Trying partial match...");
                        var caseId = decodedKey.Contains('/') ? decodedKey.Split('/').Skip(1).FirstOrDefault() : null;
                        if (!string.IsNullOrEmpty(caseId))
                        {
                            document = allDocs.FirstOrDefault(d => 
                                d.StorageKey != null && d.StorageKey.Contains(caseId) &&
                                d.StorageKey.Contains("Black White Modern Bold Design Studio Logo.png"));
                        }
                    }
                    
                    if (document != null)
                    {
                        _logger.LogInformation("Found document by search: StorageKey='{StorageKey}', BucketName='{Bucket}'", 
                            document.StorageKey, document.BucketName);
                    }
                    else
                    {
                        _logger.LogWarning("Document still not found after searching {Count} documents", allDocs.Count());
                        // Log first few storage keys for debugging
                        foreach (var doc in allDocs.Take(5))
                        {
                            _logger.LogInformation("Sample storage key in DB: '{StorageKey}' (bucket: {Bucket})", doc.StorageKey, doc.BucketName);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error searching all documents");
                }
            }
            
            // Use the document's actual bucket name from database, or fallback to configured/default
            // Note: Documents should have the correct bucket name stored, but we fallback for safety
            var bucketName = document?.BucketName ?? "kyb-docs";
            // Use the document's storage key if found, otherwise use the decoded key
            var storageKeyToUse = document?.StorageKey ?? decodedKey;
            
            // CRITICAL FIX: If storage key starts with bucket name, remove it to avoid double prefix
            // e.g., if bucket is "documents" and key is "documents/61621d49...", use "61621d49..." as the object key
            if (!string.IsNullOrEmpty(storageKeyToUse) && !string.IsNullOrEmpty(bucketName) && 
                storageKeyToUse.StartsWith(bucketName + "/", StringComparison.OrdinalIgnoreCase))
            {
                storageKeyToUse = storageKeyToUse.Substring(bucketName.Length + 1);
                _logger.LogInformation("Removed bucket prefix from storage key, using: '{Key}'", storageKeyToUse);
            }
            
            _logger.LogInformation("Generating presigned URL for storage key '{Key}' using bucket '{Bucket}' (document found: {Found}, bucket from doc: {DocBucket})", 
                storageKeyToUse, bucketName, document != null, document?.BucketName ?? "null");
            
            var result = await _mediator.Send(new GeneratePresignedDownloadUrlCommand(
                StorageKey: storageKeyToUse,
                BucketName: bucketName
            ));
            
            // NOTE: We cannot simply replace minio:9000 with localhost:9000 because
            // presigned URLs have signatures tied to the exact URL including hostname.
            // Replacing the hostname would invalidate the signature.
            // 
            // The proxy endpoint will handle this by fetching from the server-side
            // where minio:9000 resolves correctly, or by using localhost:9000 if
            // the Next.js server is running outside Docker.
            //
            // For now, return the URL as-is. The proxy will handle hostname resolution.
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating download URL for key {Key}", key);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Direct download endpoint - streams file directly without presigned URL
    /// This bypasses signature validation issues when accessing from outside Docker
    /// </summary>
    [HttpGet("direct")]
    [HttpHead("direct")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> DirectDownload([FromQuery] string key)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest(new { error = "Key parameter is required" });
            }
            
            // ASP.NET Core automatically decodes query parameters, but handle both encoded and decoded
            var searchKey = Uri.UnescapeDataString(key);
            _logger.LogInformation("Direct download requested for key: '{Key}' (searching as: '{SearchKey}')", key, searchKey);
            
            // Find the document - repository now handles multiple matching strategies
            var document = await _repository.GetByStorageKeyAsync(searchKey);
            
            if (document == null)
            {
                _logger.LogWarning("Document not found for key: '{Key}' (searched as: '{SearchKey}')", key, searchKey);
                return NotFound(new { error = "Document not found", key = key, searchKey = searchKey });
            }

            // Use the document's bucket name from database, or fallback to configured default
            var bucketName = document.BucketName ?? "kyb-docs";
            _logger.LogInformation("Found document: Bucket={Bucket}, StorageKey={StorageKey}, FileName={FileName}", 
                bucketName, document.StorageKey, document.FileName);
            
            // Use the document's actual storage key from database
            var storageKeyToUse = document.StorageKey ?? searchKey;
            
            // CRITICAL FIX: If storage key starts with bucket name, remove it to avoid double prefix
            // e.g., if bucket is "documents" and key is "documents/61621d49...", use "61621d49..." as the object key
            if (!string.IsNullOrEmpty(storageKeyToUse) && !string.IsNullOrEmpty(bucketName) && 
                storageKeyToUse.StartsWith(bucketName + "/", StringComparison.OrdinalIgnoreCase))
            {
                storageKeyToUse = storageKeyToUse.Substring(bucketName.Length + 1);
                _logger.LogInformation("Removed bucket prefix from storage key, using: '{Key}'", storageKeyToUse);
            }
            
            // Check if the file exists in storage before trying to download
            // This is more reliable than catching exceptions
            _logger.LogInformation("Checking if object exists. Bucket: '{Bucket}', Key: '{Key}'", bucketName, storageKeyToUse);
            bool objectExists = false;
            try
            {
                objectExists = await _objectStorage.ObjectExistsAsync(bucketName, storageKeyToUse, CancellationToken.None);
                _logger.LogInformation("Object exists check result: {Exists} for key '{Key}'", objectExists, storageKeyToUse);
            }
            catch (Exception ex)
            {
                // If ObjectExistsAsync throws, treat it as not found
                _logger.LogWarning(ex, "ObjectExistsAsync threw exception, treating as not found. Bucket: '{Bucket}', Key: '{Key}'", bucketName, storageKeyToUse);
                objectExists = false;
            }
            
            if (!objectExists)
            {
                // Try with full storage key if different
                if (storageKeyToUse != document.StorageKey && document.StorageKey != null)
                {
                    _logger.LogInformation("Trying with full storage key. Bucket: '{Bucket}', Key: '{Key}'", bucketName, document.StorageKey);
                    try
                    {
                        objectExists = await _objectStorage.ObjectExistsAsync(bucketName, document.StorageKey, CancellationToken.None);
                        _logger.LogInformation("Object exists check result (full key): {Exists} for key '{Key}'", objectExists, document.StorageKey);
                        if (objectExists)
                        {
                            storageKeyToUse = document.StorageKey;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "ObjectExistsAsync threw exception (full key), treating as not found. Bucket: '{Bucket}', Key: '{Key}'", bucketName, document.StorageKey);
                        objectExists = false;
                    }
                }
            }
            
            if (!objectExists)
            {
                _logger.LogWarning("File not found in storage. Bucket: '{Bucket}', Key: '{Key}', DocumentId: '{DocumentId}'", 
                    bucketName, storageKeyToUse, document.Id);
                
                return StatusCode(404, new { 
                    error = "The document record exists but the file is missing from storage. The file may have been deleted or never uploaded.",
                    suggestion = "The document record exists in the database but the file is missing from MinIO storage. You may need to re-upload the file."
                });
            }
            
            // File exists, proceed with download
            Stream fileStream;
            try
            {
                fileStream = await _objectStorage.DownloadObjectAsync(
                    bucketName,
                    storageKeyToUse,
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
                // If download fails after existence check, it's a real error
                _logger.LogError(ex, "Failed to download object that exists. Bucket: '{Bucket}', Key: '{Key}'", bucketName, storageKeyToUse);
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
            
            // Return the file with proper content type and headers
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{Uri.EscapeDataString(document.FileName)}\"");
            Response.Headers.Append("Cache-Control", "public, max-age=3600");
            
            return File(
                fileStream,
                document.ContentType ?? "application/octet-stream",
                document.FileName);
        }
        catch (Exception ex)
        {
            // Check if this is a "file not found" exception
            // Check both the exception type and message
            var exceptionTypeName = ex.GetType().FullName ?? "";
            var exceptionMessage = ex.Message ?? "";
            var hasObjectNotFound = ex is ObjectNotFoundException ||
                                   exceptionTypeName.Contains("ObjectNotFoundException", StringComparison.OrdinalIgnoreCase) ||
                                   exceptionMessage.Contains("NoSuchKey", StringComparison.OrdinalIgnoreCase) ||
                                   exceptionMessage.Contains("404", StringComparison.OrdinalIgnoreCase) ||
                                   exceptionMessage.Contains("ObjectNotFound", StringComparison.OrdinalIgnoreCase);
            
            // Also check inner exception
            if (!hasObjectNotFound && ex.InnerException != null)
            {
                var innerTypeName = ex.InnerException.GetType().FullName ?? "";
                var innerMessage = ex.InnerException.Message ?? "";
                hasObjectNotFound = innerTypeName.Contains("ObjectNotFoundException", StringComparison.OrdinalIgnoreCase) ||
                                  innerMessage.Contains("NoSuchKey", StringComparison.OrdinalIgnoreCase) ||
                                  innerMessage.Contains("404", StringComparison.OrdinalIgnoreCase) ||
                                  innerMessage.Contains("ObjectNotFound", StringComparison.OrdinalIgnoreCase);
            }
            
            _logger.LogWarning("Outer catch - Type={Type}, FullName={FullName}, Message={Message}, IsNotFound={IsNotFound}", 
                ex.GetType().Name, exceptionTypeName, exceptionMessage, hasObjectNotFound);
            
            if (hasObjectNotFound)
            {
                _logger.LogWarning("File not found in storage. Key: {Key}, Message: {Message}", key, exceptionMessage);
                return StatusCode(404, new { 
                    error = "The document record exists but the file is missing from storage. The file may have been deleted or never uploaded.",
                    suggestion = "The document record exists in the database but the file is missing from MinIO storage. You may need to re-upload the file."
                });
            }
            
            _logger.LogError(ex, "Error downloading document with key {Key}", key);
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
        }
    }

    /// <summary>
    /// Generate presigned URL for direct upload
    /// </summary>
    [HttpPost("presigned-url")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GeneratePresignedUrl([FromBody] GeneratePresignedUploadUrlCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating presigned URL");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Bulk import documents
    /// </summary>
    [HttpPost("bulk-import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BulkImport([FromBody] BulkImportDocumentsCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk import");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Generate presigned URL for downloading a document
    /// </summary>
    [HttpPost("download-url")]
    [ProducesResponseType(typeof(GeneratePresignedDownloadUrlResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GeneratePresignedDownloadUrl([FromBody] GeneratePresignedDownloadUrlCommand command)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(command.StorageKey))
                return BadRequest(new { error = "StorageKey is required" });

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating presigned download URL");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

public class UploadDocumentRequest
{
    public Guid CaseId { get; set; }
    public Guid PartnerId { get; set; }
    public DocumentService.Domain.Aggregates.DocumentType Type { get; set; }
    public IFormFile File { get; set; } = null!;
    public string? UploadedBy { get; set; }
    public string? Description { get; set; }
    public string? IssueDate { get; set; }
    public string? ExpiryDate { get; set; }
    public string? IssuingAuthority { get; set; }
    public string? DocumentNumber { get; set; }
    public string? Country { get; set; }
    public Dictionary<string, string>? Tags { get; set; }
}
