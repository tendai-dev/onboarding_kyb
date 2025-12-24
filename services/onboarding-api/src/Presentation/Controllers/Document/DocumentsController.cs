using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Document.Commands;
using OnboardingApi.Application.Document.Interfaces;
using OnboardingApi.Application.Document.Queries;
using OnboardingApi.Domain.Document.ValueObjects;
using OnboardingApi.Application.Interfaces;
using System;
using System.Linq;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;

namespace OnboardingApi.Presentation.Controllers.Document;

[ApiController]
[Route("api/v1/documents")]
[Produces("application/json")]
[Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Require authentication for document operations
public class DocumentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDocumentRepository _repository;
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<DocumentsController> _logger;
    private readonly ICurrentUser _currentUser;
    private readonly IOnboardingCaseRepository _caseRepository;

    public DocumentsController(
        IMediator mediator, 
        IDocumentRepository repository, 
        IObjectStorage objectStorage, 
        ILogger<DocumentsController> logger,
        ICurrentUser currentUser,
        IOnboardingCaseRepository caseRepository)
    {
        _mediator = mediator;
        _repository = repository;
        _objectStorage = objectStorage;
        _logger = logger;
        _currentUser = currentUser;
        _caseRepository = caseRepository;
    }

    /// <summary>
    /// Upload a document for a KYB case
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(UploadDocumentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request)
    {
        // Log at the very start to confirm method is being called
        _logger.LogInformation("UploadDocument method called. Request received.");
        
        try
        {
            // Log request details for debugging
            _logger.LogInformation("Request details: File={HasFile}, CaseId={CaseId}, PartnerId={PartnerId}, Type={Type}",
                request?.File != null ? "Present" : "NULL",
                request?.CaseId ?? Guid.Empty,
                request?.PartnerId ?? Guid.Empty,
                request?.Type.ToString() ?? "NULL");
            
            // Check model binding - if ModelState is invalid, return detailed errors
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .Select(x => new { field = x.Key, errors = x.Value?.Errors.Select(e => e.ErrorMessage) })
                    .ToList();
                
                _logger.LogWarning("Model binding failed for document upload: {Errors}", 
                    System.Text.Json.JsonSerializer.Serialize(errors));
                
                return BadRequest(new { 
                    error = "Invalid request data", 
                    details = errors,
                    message = "The request data could not be parsed. Please check that all required fields are provided and in the correct format."
                });
            }

            // Validate required fields
            if (request.File == null || request.File.Length == 0)
            {
                _logger.LogWarning("Document upload failed: No file provided");
                return BadRequest(new { error = "No file provided", message = "A file must be included in the upload request." });
            }

            if (request.CaseId == Guid.Empty)
            {
                _logger.LogWarning("Document upload failed: Invalid CaseId");
                return BadRequest(new { error = "Invalid CaseId", message = "CaseId is required and must be a valid GUID." });
            }

            if (request.PartnerId == Guid.Empty)
            {
                _logger.LogWarning("Document upload failed: Invalid PartnerId");
                return BadRequest(new { error = "Invalid PartnerId", message = "PartnerId is required and must be a valid GUID." });
            }

            // SECURITY FIX: Validate file size (10MB limit)
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (request.File.Length > maxFileSize)
            {
                _logger.LogWarning("Document upload failed: File size {Size} exceeds maximum {MaxSize}", request.File.Length, maxFileSize);
                return BadRequest(new { error = "File size exceeds maximum allowed size", message = $"File size must be less than {maxFileSize / (1024 * 1024)}MB." });
            }

            // SECURITY FIX: Validate file name
            if (string.IsNullOrWhiteSpace(request.File.FileName) || request.File.FileName.Length > 255)
            {
                _logger.LogWarning("Document upload failed: Invalid file name");
                return BadRequest(new { error = "Invalid file name", message = "File name is required and must be less than 255 characters." });
            }

            // SECURITY FIX: Sanitize file name to prevent path traversal
            var sanitizedFileName = System.IO.Path.GetFileName(request.File.FileName);
            if (sanitizedFileName != request.File.FileName || sanitizedFileName.Contains(".."))
            {
                _logger.LogWarning("Document upload failed: Potentially malicious file name {FileName}", request.File.FileName);
                return BadRequest(new { error = "Invalid file name", message = "File name contains invalid characters." });
            }

            // SECURITY FIX: Validate file content type
            var allowedContentTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
            if (!allowedContentTypes.Contains(request.File.ContentType?.ToLowerInvariant()))
            {
                _logger.LogWarning("Document upload failed: Invalid content type {ContentType}", request.File.ContentType);
                return BadRequest(new { error = "Invalid file type", message = $"File type {request.File.ContentType} is not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX." });
            }

            // SECURITY FIX: Validate file extension matches content type
            var fileExtension = System.IO.Path.GetExtension(request.File.FileName)?.ToLowerInvariant();
            var extensionContentTypeMap = new Dictionary<string, string[]>
            {
                { ".pdf", new[] { "application/pdf" } },
                { ".jpg", new[] { "image/jpeg", "image/jpg" } },
                { ".jpeg", new[] { "image/jpeg", "image/jpg" } },
                { ".png", new[] { "image/png" } },
                { ".doc", new[] { "application/msword" } },
                { ".docx", new[] { "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } }
            };
            if (!string.IsNullOrEmpty(fileExtension) && extensionContentTypeMap.ContainsKey(fileExtension))
            {
                if (!extensionContentTypeMap[fileExtension].Contains(request.File.ContentType?.ToLowerInvariant()))
                {
                    _logger.LogWarning("Document upload failed: Content type {ContentType} does not match extension {Extension}", request.File.ContentType, fileExtension);
                    return BadRequest(new { error = "File type mismatch", message = "File extension does not match the file content type." });
                }
            }

            // SECURITY FIX: Mask PII in logs
            _logger.LogInformation("Processing document upload: FileName={FileName}, CaseId={CaseId}, PartnerId={PartnerId}, Type={Type}, Size={Size}",
                sanitizedFileName, 
                Infrastructure.Utilities.LoggingExtensions.MaskGuid(request.CaseId), 
                Infrastructure.Utilities.LoggingExtensions.MaskGuid(request.PartnerId), 
                request.Type, 
                request.File.Length);

            var command = new UploadDocumentCommand
            {
                CaseId = request.CaseId,
                PartnerId = request.PartnerId,
                Type = request.Type,
                FileName = sanitizedFileName, // SECURITY FIX: Use sanitized file name
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
            _logger.LogInformation("Document uploaded successfully: DocumentId={DocumentId}, FileName={FileName}",
                result.DocumentId, sanitizedFileName);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document: {Message}, StackTrace: {StackTrace}", 
                ex.Message, ex.StackTrace);
            
            // Log inner exception if present
            if (ex.InnerException != null)
            {
                _logger.LogError(ex.InnerException, "Inner exception: {Message}", ex.InnerException.Message);
            }
            
            // SECURITY FIX: Never expose stack traces or detailed errors to clients
            var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" ||
                               Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") == "Development";
            
            // Log full error details server-side only
            _logger.LogError(ex, "Error uploading document: {Message}", ex.Message);
            
            // Return error in format expected by frontend - generic message only
            var errorResponse = new { 
                error = "Internal server error", // SECURITY: Always generic, never expose details
                message = "An error occurred while processing the document upload. Please try again or contact support.",
                details = isDevelopment ? new {
                    exceptionType = ex.GetType().Name,
                    message = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                } : null
            };
            
            return StatusCode(500, errorResponse);
        }
    }

    /// <summary>
    /// List all documents (with pagination)
    /// SECURITY: Users can only see their own documents unless admin/reviewer
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedDocumentsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAll([FromQuery] int skip = 0, [FromQuery] int take = 100)
    {
        try
        {
            // SECURITY FIX: Filter by user's cases unless admin/reviewer
            var userEmail = _currentUser.Email;
            if (!string.IsNullOrWhiteSpace(userEmail) && !User.IsInRole("admin") && !User.IsInRole("Administrator") && !User.IsInRole("reviewer"))
            {
                var userPartnerId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(userEmail);
                // Get all case IDs for this user
                var userCases = await _caseRepository.GetByPartnerIdAsync(userPartnerId);
                var userCaseIdSet = userCases.Select(c => c.Id).ToHashSet();
                
                if (userCaseIdSet.Count == 0)
                {
                    // User has no cases, return empty result
                    return Ok(new PagedDocumentsResult
                    {
                        Items = new List<DocumentDto>(),
                        TotalCount = 0,
                        Skip = skip,
                        Take = take
                    });
                }
                
                // Get documents for user's cases only
                var userDocuments = new List<DomainDocument>();
                foreach (var caseId in userCaseIdSet)
                {
                    var caseDocuments = await _repository.GetByCaseIdAsync(caseId);
                    userDocuments.AddRange(caseDocuments);
                }
                
                // Apply pagination
                var paginatedDocuments = userDocuments.Skip(skip).Take(take).ToList();
                var userResult = new PagedDocumentsResult
                {
                    Items = paginatedDocuments.Select(d => DocumentQueryHelpers.MapToDto(d)).ToList(),
                    TotalCount = userDocuments.Count,
                    Skip = skip,
                    Take = take
                };
                
                return Ok(userResult);
            }
            
            // Admin/reviewer can see all documents
            var query = new GetAllDocumentsQuery(skip, take);
            var adminResult = await _mediator.Send(query);
            return Ok(adminResult);
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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListByCase(Guid caseId)
    {
        try
        {
            // Check if user is admin or reviewer first - they can access all documents
            // Use multiple methods to check roles for compatibility
            // Include "Administrator" which is sent by the admin portal
            var isAdmin = _currentUser.HasRole("admin") || 
                         _currentUser.HasRole("Admin") ||
                         _currentUser.HasRole("Administrator") ||
                         User.IsInRole("admin") || 
                         User.IsInRole("Admin") ||
                         User.IsInRole("Administrator") ||
                         _currentUser.Roles.Any(r => r.Equals("admin", StringComparison.OrdinalIgnoreCase) || 
                                                     r.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                                                     r.Equals("Administrator", StringComparison.OrdinalIgnoreCase));
            
            var isReviewer = _currentUser.HasRole("reviewer") || 
                            _currentUser.HasRole("Reviewer") ||
                            User.IsInRole("reviewer") || 
                            User.IsInRole("Reviewer") ||
                            _currentUser.Roles.Any(r => r.Equals("reviewer", StringComparison.OrdinalIgnoreCase) || 
                                                        r.Equals("Reviewer", StringComparison.OrdinalIgnoreCase));
            
            _logger.LogDebug("Document access check - CaseId: {CaseId}, IsAdmin: {IsAdmin}, IsReviewer: {IsReviewer}, UserRoles: {Roles}",
                Infrastructure.Utilities.LoggingExtensions.MaskGuid(caseId),
                isAdmin,
                isReviewer,
                string.Join(", ", _currentUser.Roles));
            
            // SECURITY FIX: Verify case ownership before listing documents
            // Admins and reviewers can access all documents, regardless of case ownership
            if (!isAdmin && !isReviewer)
            {
                var caseEntity = await _caseRepository.GetByIdAsync(caseId);
                if (caseEntity != null)
                {
                    var userEmail = _currentUser.Email;
                    if (!string.IsNullOrWhiteSpace(userEmail))
                    {
                        var expectedPartnerId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(userEmail);
                        if (caseEntity.PartnerId != expectedPartnerId)
                        {
                            _logger.LogWarning("Document list denied - case ownership mismatch. User: {Email}, Case PartnerId: {CasePartnerId}",
                                Infrastructure.Utilities.LoggingExtensions.MaskEmail(userEmail),
                                Infrastructure.Utilities.LoggingExtensions.MaskGuid(caseEntity.PartnerId));
                            return StatusCode(403, new { error = "Access denied", message = "This case does not belong to your account" });
                        }
                    }
                }
                else
                {
                    // Case doesn't exist and user is not admin/reviewer - deny access
                    _logger.LogWarning("Document list denied - case not found and user is not admin/reviewer. CaseId: {CaseId}",
                        Infrastructure.Utilities.LoggingExtensions.MaskGuid(caseId));
                    return StatusCode(403, new { error = "Access denied", message = "Case not found or access denied" });
                }
            }

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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid documentId)
    {
        try
        {
            var query = new GetDocumentByIdQuery(documentId);
            var result = await _mediator.Send(query);
            
            if (result == null)
                return NotFound(new { message = $"Document {documentId} not found" });

            // SECURITY FIX: Verify document ownership through case ownership
            var caseEntity = await _caseRepository.GetByIdAsync(result.CaseId);
            if (caseEntity != null)
            {
                var userEmail = _currentUser.Email;
                if (!string.IsNullOrWhiteSpace(userEmail))
                {
                    var expectedPartnerId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(userEmail);
                    if (caseEntity.PartnerId != expectedPartnerId && !User.IsInRole("admin") && !User.IsInRole("Administrator") && !User.IsInRole("reviewer"))
                    {
                        _logger.LogWarning("Document access denied - ownership mismatch. User: {Email}, Document CaseId: {CaseId}",
                            Infrastructure.Utilities.LoggingExtensions.MaskEmail(userEmail),
                            Infrastructure.Utilities.LoggingExtensions.MaskGuid(result.CaseId));
                        return StatusCode(403, new { error = "Access denied", message = "This document does not belong to your account" });
                    }
                }
            }

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
    /// <summary>
    /// Direct download endpoint - uses signed URL key for security
    /// SECURITY: Key should be a time-limited signed token, not a simple key
    /// </summary>
    [HttpGet("direct")]
    [HttpHead("direct")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    // SECURITY FIX: Consider implementing signed URL validation instead of AllowAnonymous
    // For now, require authentication or implement proper signed URL validation
    [Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Require authentication
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

