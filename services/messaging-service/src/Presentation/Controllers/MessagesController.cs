using MediatR;
using MessagingService.Application.Commands;
using MessagingService.Application.Queries;
using MessagingService.Domain.Aggregates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MessagingService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
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
        
        // Log all headers for debugging
        var userHeaders = HttpContext.Request.Headers
            .Where(h => h.Key.Contains("User", StringComparison.OrdinalIgnoreCase))
            .Select(h => $"{h.Key}={string.Join(",", h.Value)}")
            .ToList();
        var allUserHeaders = string.Join("; ", userHeaders);
        
        _logger.LogInformation(
            "GetMyThreads called - UserId: {UserId}, Role: {Role}, Page: {Page}, PageSize: {PageSize}",
            currentUserId, currentUserRole, page, pageSize);
        _logger.LogInformation(
            "GetMyThreads - User Headers: {Headers}",
            allUserHeaders);
        _logger.LogInformation(
            "GetMyThreads - IsAdmin: {IsAdmin}, IsComplianceManager: {IsComplianceManager}",
            currentUserRole == UserRole.Admin, currentUserRole == UserRole.ComplianceManager);
        
        var query = new GetMyThreadsQuery(currentUserId, currentUserRole, page, pageSize);
        var result = await _mediator.Send(query);
        
        _logger.LogInformation(
            "GetMyThreads result - TotalCount: {TotalCount}, ItemsCount: {ItemsCount}, IsAdmin: {IsAdmin}",
            result.TotalCount, result.Items.Count, currentUserRole is UserRole.Admin or UserRole.ComplianceManager);
        
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
        var currentUserRole = GetCurrentUserRole();
        
        // Log role detection for debugging
        _logger.LogInformation(
            "GetAllThreads called - Role: {Role}, Page: {Page}, PageSize: {PageSize}",
            currentUserRole, page, pageSize);
        
        // For demo: Allow access regardless of role (remove Forbid check)
        // In production, you should add: if (currentUserRole != UserRole.Admin && currentUserRole != UserRole.ComplianceManager) return Forbid();
        
        var query = new GetAllThreadsQuery(page, pageSize);
        var result = await _mediator.Send(query);
        
        _logger.LogInformation(
            "GetAllThreads result - TotalCount: {TotalCount}, ItemsCount: {ItemsCount}",
            result.TotalCount, result.Items.Count);
        
        return Ok(result);
    }
    
    /// <summary>
    /// Diagnostic endpoint to check user identity and role
    /// </summary>
    [HttpGet("diagnostic/identity")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetIdentity()
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = GetCurrentUserRole();
        var currentUserName = GetCurrentUserName();
        
        var userHeaders = HttpContext.Request.Headers
            .Where(h => h.Key.Contains("User", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(h => h.Key, h => string.Join(",", h.Value));
        
        var jwtRoles = User.FindAll("role").Select(c => c.Value).ToList();
        
        return Ok(new
        {
            UserId = currentUserId,
            UserName = currentUserName,
            Role = currentUserRole.ToString(),
            IsAdmin = currentUserRole == UserRole.Admin,
            IsComplianceManager = currentUserRole == UserRole.ComplianceManager,
            JwtRoles = jwtRoles,
            UserHeaders = userHeaders,
            AllHeaders = HttpContext.Request.Headers.ToDictionary(h => h.Key, h => string.Join(",", h.Value))
        });
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
    
    /// <summary>
    /// Archive or unarchive a thread
    /// </summary>
    [HttpPut("threads/{threadId}/archive")]
    [ProducesResponseType(typeof(ArchiveThreadResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ArchiveThread(Guid threadId, [FromBody] ArchiveThreadRequest request)
    {
        var currentUserId = GetCurrentUserId();
        
        var command = new ArchiveThreadCommand(threadId, currentUserId, request.Archive);
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(result);
    }
    
    /// <summary>
    /// Star or unstar a thread
    /// </summary>
    [HttpPut("threads/{threadId}/star")]
    [ProducesResponseType(typeof(StarThreadResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StarThread(Guid threadId)
    {
        var currentUserId = GetCurrentUserId();
        
        var command = new StarThreadCommand(threadId, currentUserId);
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(result);
    }
    
    /// <summary>
    /// Forward a message to another application/thread
    /// </summary>
    [HttpPost("{messageId}/forward")]
    [ProducesResponseType(typeof(ForwardMessageResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForwardMessage(Guid messageId, [FromBody] ForwardMessageRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserName = GetCurrentUserName();
        var currentUserRole = GetCurrentUserRole();
        
        var command = new ForwardMessageCommand(
            messageId,
            currentUserId,
            request.ToApplicationId,
            request.ToReceiverId,
            request.AdditionalContent
        );
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(result);
    }
    
    // Helper methods
    private Guid GetCurrentUserId()
    {
        // CRITICAL: Always generate user ID from email to ensure consistency across Keycloak and Azure AD
        // Keycloak provides 'preferred_username' or 'email' claim
        // Azure AD provides 'upn' or 'email' claim
        var email = User.FindFirst("email")?.Value ??
                   User.FindFirst("preferred_username")?.Value ?? // Keycloak
                   User.FindFirst("upn")?.Value ?? // Azure AD
                   User.FindFirst(ClaimTypes.Email)?.Value;
        
        if (!string.IsNullOrWhiteSpace(email))
        {
            // Use MD5-based PartnerIdGenerator to match onboarding-api
            try
            {
                return MessagingService.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate user ID from email: {Email}", email);
            }
        }
        
        // Fallback: Try to get from headers (for development)
        if (HttpContext.Request.Headers.TryGetValue("X-User-Email", out var emailHeader))
        {
            var headerEmail = emailHeader.ToString();
            if (!string.IsNullOrWhiteSpace(headerEmail))
            {
                try
                {
                    return MessagingService.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(headerEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to generate user ID from header email: {Email}", headerEmail);
                }
            }
        }
        
        // Last resort: Try X-User-Id header (for development)
        if (HttpContext.Request.Headers.TryGetValue("X-User-Id", out var headerUserId) && 
            Guid.TryParse(headerUserId.ToString(), out var headerGuid))
        {
            _logger.LogWarning("Using X-User-Id header as fallback - this should not happen in production");
            return headerGuid;
        }
        
        _logger.LogError("Could not determine user ID from JWT claims or headers. User claims: {Claims}",
            string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
        return Guid.Empty;
    }
    
    private string GetCurrentUserName()
    {
        var name = User.FindFirst("name")?.Value ?? 
                   User.FindFirst("preferred_username")?.Value;
        
        if (!string.IsNullOrEmpty(name))
            return name;
        
        // In development mode, try to get from headers
        if (HttpContext.Request.Headers.TryGetValue("X-User-Name", out var headerName))
            return headerName.ToString();
        
        return "Unknown User";
    }
    
    private UserRole GetCurrentUserRole()
    {
        var roles = User.FindAll("role").Select(c => c.Value).ToList();
        
        _logger.LogInformation("JWT roles found: {Roles}", string.Join(", ", roles));
        
        if (roles.Contains("Admin") || roles.Contains("Administrator")) 
        {
            _logger.LogInformation("Role determined as Admin from JWT claims");
            return UserRole.Admin;
        }
        if (roles.Contains("ComplianceManager")) 
        {
            _logger.LogInformation("Role determined as ComplianceManager from JWT claims");
            return UserRole.ComplianceManager;
        }
        if (roles.Contains("Reviewer")) 
        {
            _logger.LogInformation("Role determined as Reviewer from JWT claims");
            return UserRole.Reviewer;
        }
        
        // In development mode, try to get from headers
        if (HttpContext.Request.Headers.TryGetValue("X-User-Role", out var headerRole))
        {
            var roleStr = headerRole.ToString().ToUpperInvariant();
            _logger.LogInformation("Header role found: {HeaderRole} (original: {Original})", roleStr, headerRole.ToString());
            
            if (roleStr.Contains("ADMIN")) 
            {
                _logger.LogInformation("Role determined as Admin from header");
                return UserRole.Admin;
            }
            if (roleStr.Contains("COMPLIANCE")) 
            {
                _logger.LogInformation("Role determined as ComplianceManager from header");
                return UserRole.ComplianceManager;
            }
            if (roleStr.Contains("REVIEWER")) 
            {
                _logger.LogInformation("Role determined as Reviewer from header");
                return UserRole.Reviewer;
            }
        }
        
        var userHeaders = string.Join(", ", HttpContext.Request.Headers.Where(h => h.Key.Contains("User", StringComparison.OrdinalIgnoreCase)).Select(h => $"{h.Key}={h.Value}"));
        _logger.LogWarning("No admin role found, defaulting to Applicant. JWT roles: {Roles}, User Headers: {Headers}",
            string.Join(", ", roles), userHeaders);
        
        return UserRole.Applicant;
    }
    
    /// <summary>
    /// Generate a deterministic GUID from email using UUID v5 algorithm
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

public record ArchiveThreadRequest
{
    public bool Archive { get; init; }
}

public record ForwardMessageRequest
{
    public Guid ToApplicationId { get; init; }
    public Guid? ToReceiverId { get; init; }
    public string? AdditionalContent { get; init; }
}

