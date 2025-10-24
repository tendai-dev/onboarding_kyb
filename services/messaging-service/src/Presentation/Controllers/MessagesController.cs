using MediatR;
using MessagingService.Application.Commands;
using MessagingService.Application.Queries;
using MessagingService.Domain.Aggregates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        
        var command = new SendMessageCommand(
            request.ApplicationId,
            currentUserId,
            currentUserName,
            currentUserRole,
            request.Content,
            request.ReceiverId
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
    
    // Helper methods
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub") ?? User.FindFirst("oid") ?? User.FindFirst("user_id");
        return Guid.TryParse(userIdClaim?.Value, out var userId) ? userId : Guid.Empty;
    }
    
    private string GetCurrentUserName()
    {
        return User.FindFirst("name")?.Value ?? 
               User.FindFirst("preferred_username")?.Value ?? 
               "Unknown User";
    }
    
    private UserRole GetCurrentUserRole()
    {
        var roles = User.FindAll("role").Select(c => c.Value).ToList();
        
        if (roles.Contains("Admin")) return UserRole.Admin;
        if (roles.Contains("ComplianceManager")) return UserRole.ComplianceManager;
        if (roles.Contains("Reviewer")) return UserRole.Reviewer;
        
        return UserRole.Applicant;
    }
}

// Request/Response DTOs
public record SendMessageRequest(
    Guid ApplicationId,
    string Content,
    Guid? ReceiverId = null
);

public record UnreadCountResponse
{
    public int Count { get; init; }
}

