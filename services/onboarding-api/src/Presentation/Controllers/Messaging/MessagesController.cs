using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Messaging.Commands;
using OnboardingApi.Application.Messaging.Queries;
using OnboardingApi.Domain.Messaging.ValueObjects;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Controllers.Messaging;

[ApiController]
[Route("api/v1/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<MessagesController> _logger;
    
    public MessagesController(IMediator mediator, ILogger<MessagesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }
    
    /// <summary>
    /// Send a message in an application thread
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SendMessageResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserName = GetCurrentUserName();
        var currentUserRole = GetCurrentUserRole();
        
        _logger.LogInformation(
            "User {UserId} sending message in application {ApplicationId}",
            currentUserId, request.ApplicationId);
        
        // Convert attachment requests to attachment info
        var attachments = request.Attachments?.Select(a => new AttachmentInfo(
            a.FileName,
            a.ContentType,
            a.FileSizeBytes,
            a.StorageKey,
            a.StorageUrl,
            a.DocumentId,
            a.Description
        ));
        
        var command = new SendMessageCommand(
            request.ApplicationId,
            currentUserId,
            currentUserName,
            currentUserRole,
            request.Content,
            request.ReceiverId,
            request.ReplyToMessageId,
            attachments
        );
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return CreatedAtAction(
            nameof(GetThreadByApplication),
            new { applicationId = request.ApplicationId },
            result
        );
    }
    
    /// <summary>
    /// Get message thread for an application
    /// </summary>
    [HttpGet("threads/application/{applicationId}")]
    [ProducesResponseType(typeof(MessageThreadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetThreadByApplication(Guid applicationId)
    {
        var query = new GetThreadByApplicationIdQuery(applicationId);
        var result = await _mediator.Send(query);
        
        if (result == null)
            return NotFound(new { message = $"No thread found for application: {applicationId}" });
        
        return Ok(result);
    }
    
    /// <summary>
    /// Get messages in a thread
    /// </summary>
    [HttpGet("threads/{threadId}/messages")]
    [ProducesResponseType(typeof(PagedResult<MessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMessages(
        Guid threadId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = new GetMessagesQuery(threadId, page, pageSize);
        var result = await _mediator.Send(query);
        
        return Ok(result);
    }
    
    /// <summary>
    /// Get my message threads
    /// </summary>
    [HttpGet("threads/my")]
    [ProducesResponseType(typeof(PagedResult<MessageThreadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyThreads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();
        
        var query = new GetMyThreadsQuery(currentUserId, currentUserRole, page, pageSize);
        var result = await _mediator.Send(query);
        
        return Ok(result);
    }
    
    /// <summary>
    /// Get all message threads (admin only)
    /// </summary>
    [HttpGet("threads/all")]
    [ProducesResponseType(typeof(PagedResult<MessageThreadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllThreads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetAllThreadsQuery(page, pageSize);
        var result = await _mediator.Send(query);
        
        return Ok(result);
    }
    
    /// <summary>
    /// Get unread message count
    /// </summary>
    [HttpGet("unread/count")]
    [ProducesResponseType(typeof(UnreadCountResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();
        
        var query = new GetUnreadCountQuery(currentUserId, currentUserRole);
        var count = await _mediator.Send(query);
        
        return Ok(new UnreadCountResponse { Count = count });
    }
    
    /// <summary>
    /// Mark message as read
    /// </summary>
    [HttpPut("{messageId}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkAsRead(Guid messageId)
    {
        var currentUserId = GetCurrentUserId();
        
        var command = new MarkMessageAsReadCommand(messageId, currentUserId);
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Message marked as read" });
    }
    
    /// <summary>
    /// Delete a message
    /// </summary>
    [HttpDelete("{messageId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteMessage(Guid messageId)
    {
        var currentUserId = GetCurrentUserId();
        
        var command = new DeleteMessageCommand(messageId, currentUserId);
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Message deleted successfully" });
    }
    
    /// <summary>
    /// Star or unstar a message
    /// </summary>
    [HttpPut("{messageId}/star")]
    [ProducesResponseType(typeof(StarMessageResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StarMessage(Guid messageId)
    {
        var currentUserId = GetCurrentUserId();
        
        var command = new StarMessageCommand(messageId, currentUserId);
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(result);
    }
    
    // Helper methods
    private Guid GetCurrentUserId()
    {
        // Priority 1: Check X-User-Id header (frontend sends this)
        if (HttpContext.Request.Headers.TryGetValue("X-User-Id", out var headerUserId))
        {
            var userIdString = headerUserId.ToString().Trim();
            _logger.LogDebug("Received X-User-Id header: {UserId}", userIdString);
            
            if (Guid.TryParse(userIdString, out var headerGuid))
            {
                _logger.LogDebug("Successfully parsed X-User-Id as GUID: {Guid}", headerGuid);
                return headerGuid;
            }
            else
            {
                _logger.LogWarning("X-User-Id header value '{UserId}' is not a valid GUID format", userIdString);
            }
        }
        else
        {
            _logger.LogDebug("X-User-Id header not found in request");
        }
        
        // Priority 2: Check X-User-Email header and generate GUID from it
        if (HttpContext.Request.Headers.TryGetValue("X-User-Email", out var headerEmail))
        {
            var email = headerEmail.ToString().Trim();
            _logger.LogDebug("Received X-User-Email header: {Email}", email);
            
            if (!string.IsNullOrWhiteSpace(email))
            {
                // Use proper hash-based GUID generation (RFC 4122 version 5)
                // This matches the frontend's generateUserIdFromEmail function
                using (var md5 = System.Security.Cryptography.MD5.Create())
                {
                    var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(email.ToLowerInvariant()));
                    // Set version (5) and variant bits according to RFC 4122
                    hash[6] = (byte)((hash[6] & 0x0F) | 0x50); // Version 5
                    hash[8] = (byte)((hash[8] & 0x3F) | 0x80); // Variant 10
                    var generatedGuid = new Guid(hash);
                    _logger.LogDebug("Generated GUID from X-User-Email: {Guid}", generatedGuid);
                    return generatedGuid;
                }
            }
        }
        
        // Priority 3: Try to get email from JWT claims
        var emailFromClaims = User.FindFirst("email")?.Value ??
                   User.FindFirst("preferred_username")?.Value ??
                   User.FindFirst("upn")?.Value ??
                   User.FindFirst(ClaimTypes.Email)?.Value;
        
        if (!string.IsNullOrWhiteSpace(emailFromClaims))
        {
            _logger.LogDebug("Found email in JWT claims: {Email}", emailFromClaims);
            // Use proper hash-based GUID generation (RFC 4122 version 5)
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(emailFromClaims.ToLowerInvariant()));
                // Set version (5) and variant bits according to RFC 4122
                hash[6] = (byte)((hash[6] & 0x0F) | 0x50); // Version 5
                hash[8] = (byte)((hash[8] & 0x3F) | 0x80); // Variant 10
                var generatedGuid = new Guid(hash);
                _logger.LogDebug("Generated GUID from JWT email: {Guid}", generatedGuid);
                return generatedGuid;
            }
        }
        
        _logger.LogWarning("Could not determine user ID - no X-User-Id header, no X-User-Email header, and no email in JWT claims");
        return Guid.Empty;
    }
    
    private string GetCurrentUserName()
    {
        var name = User.FindFirst("name")?.Value ?? 
                   User.FindFirst("preferred_username")?.Value;
        
        if (!string.IsNullOrEmpty(name))
            return name;
        
        if (HttpContext.Request.Headers.TryGetValue("X-User-Name", out var headerName))
            return headerName.ToString();
        
        return "Unknown User";
    }
    
    private UserRole GetCurrentUserRole()
    {
        var roles = User.FindAll("role").Select(c => c.Value).ToList();
        
        if (roles.Contains("Admin") || roles.Contains("Administrator")) 
            return UserRole.Admin;
        if (roles.Contains("ComplianceManager")) 
            return UserRole.ComplianceManager;
        if (roles.Contains("Reviewer")) 
            return UserRole.Reviewer;
        
        if (HttpContext.Request.Headers.TryGetValue("X-User-Role", out var headerRole))
        {
            var roleStr = headerRole.ToString().ToUpperInvariant();
            if (roleStr.Contains("ADMIN")) 
                return UserRole.Admin;
            if (roleStr.Contains("COMPLIANCE")) 
                return UserRole.ComplianceManager;
            if (roleStr.Contains("REVIEWER")) 
                return UserRole.Reviewer;
        }
        
        return UserRole.Applicant;
    }
}

// Request/Response DTOs
public record SendMessageRequest(
    Guid ApplicationId,
    string Content,
    Guid? ReceiverId = null,
    Guid? ReplyToMessageId = null,
    IEnumerable<AttachmentRequest>? Attachments = null
);

public record AttachmentRequest
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public string StorageKey { get; init; } = string.Empty;
    public string StorageUrl { get; init; } = string.Empty;
    public Guid? DocumentId { get; init; }
    public string? Description { get; init; }
}

public record UnreadCountResponse
{
    public int Count { get; init; }
}

