using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using OnboardingApi.Application.Document.Queries;
using OnboardingApi.Domain.Document.ValueObjects;

namespace OnboardingApi.Presentation.Controllers.Document;

[ApiController]
[Route("api/v1/documents")]
[Produces("application/json")]
[AllowAnonymous]
public class DocumentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDocumentRepository _repository;
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IMediator mediator, 
        IDocumentRepository repository, 
        IObjectStorage objectStorage, 
        ILogger<DocumentsController> logger)
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
                Metadata = new DocumentMetadata
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
    [ProducesResponseType(typeof(PagedDocumentsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAll([FromQuery] int skip = 0, [FromQuery] int take = 100)
    {
        try
        {
            var query = new GetAllDocumentsQuery(skip, take);
            var result = await _mediator.Send(query);
            return Ok(result);
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
    [ProducesResponseType(typeof(List<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByCase(Guid caseId)
    {
        try
        {
            var query = new GetDocumentsByCaseQuery(caseId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing documents for case {CaseId}", caseId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get document by ID
    /// </summary>
    [HttpGet("{documentId}")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid documentId)
    {
        try
        {
            var query = new GetDocumentByIdQuery(documentId);
            var result = await _mediator.Send(query);
            
            if (result == null)
                return NotFound(new { message = $"Document {documentId} not found" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting document {DocumentId}", documentId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Direct download endpoint - streams file directly without presigned URL
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
            
            var searchKey = Uri.UnescapeDataString(key);
            _logger.LogInformation("Direct download requested for key: '{Key}' (searching as: '{SearchKey}')", key, searchKey);
            
            var document = await _repository.GetByStorageKeyAsync(searchKey);
            
            if (document == null)
            {
                _logger.LogWarning("Document not found for key: '{Key}' (searched as: '{SearchKey}')", key, searchKey);
                return NotFound(new { error = "Document not found", key = key, searchKey = searchKey });
            }

            var bucketName = document.BucketName ?? "kyb-docs";
            var storageKeyToUse = document.StorageKey ?? searchKey;
            
            if (!string.IsNullOrEmpty(storageKeyToUse) && !string.IsNullOrEmpty(bucketName) && 
                storageKeyToUse.StartsWith(bucketName + "/", StringComparison.OrdinalIgnoreCase))
            {
                storageKeyToUse = storageKeyToUse.Substring(bucketName.Length + 1);
            }
            
            bool objectExists = false;
            try
            {
                objectExists = await _objectStorage.ObjectExistsAsync(bucketName, storageKeyToUse, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "ObjectExistsAsync threw exception, treating as not found");
                objectExists = false;
            }
            
            if (!objectExists)
            {
                return StatusCode(404, new { 
                    error = "The document record exists but the file is missing from storage."
                });
            }
            
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
                _logger.LogError(ex, "Failed to download object");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
            
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{Uri.EscapeDataString(document.FileName)}\"");
            Response.Headers.Append("Cache-Control", "public, max-age=3600");
            
            return File(
                fileStream,
                document.ContentType ?? "application/octet-stream",
                document.FileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading document with key {Key}", key);
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
        }
    }

    /// <summary>
    /// Generate presigned URL for direct upload
    /// </summary>
    [HttpPost("presigned-url")]
    [ProducesResponseType(typeof(GeneratePresignedUploadUrlResult), StatusCodes.Status200OK)]
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
    /// Generate presigned URL for downloading a document
    /// </summary>
    [HttpPost("download-url")]
    [ProducesResponseType(typeof(GeneratePresignedDownloadUrlResult), StatusCodes.Status200OK)]
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

    /// <summary>
    /// Verify a document
    /// </summary>
    [HttpPost("{documentId}/verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyDocument(Guid documentId, [FromBody] VerifyDocumentRequest request)
    {
        try
        {
            var command = new VerifyDocumentCommand(documentId, request.VerifiedBy);
            var result = await _mediator.Send(command);
            
            if (!result)
                return NotFound(new { message = $"Document {documentId} not found" });

            return Ok(new { message = "Document verified successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying document {DocumentId}", documentId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Reject a document
    /// </summary>
    [HttpPost("{documentId}/reject")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectDocument(Guid documentId, [FromBody] RejectDocumentRequest request)
    {
        try
        {
            var command = new RejectDocumentCommand(documentId, request.Reason, request.RejectedBy);
            var result = await _mediator.Send(command);
            
            if (!result)
                return NotFound(new { message = $"Document {documentId} not found" });

            return Ok(new { message = "Document rejected successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting document {DocumentId}", documentId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

public class UploadDocumentRequest
{
    public Guid CaseId { get; set; }
    public Guid PartnerId { get; set; }
    public DocumentType Type { get; set; }
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

public class VerifyDocumentRequest
{
    public string VerifiedBy { get; set; } = string.Empty;
}

public class RejectDocumentRequest
{
    public string Reason { get; set; } = string.Empty;
    public string RejectedBy { get; set; } = string.Empty;
}

