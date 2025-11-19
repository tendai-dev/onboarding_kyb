using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MessagingService.Application.Commands;
using MessagingService.Domain.Aggregates;
using MediatR;

namespace MessagingService.Presentation.Hubs;

/// <summary>
/// SignalR Hub for real-time messaging
/// </summary>
[Authorize]
public class MessageHub : Hub
{
    private readonly IMediator _mediator;
    private readonly ILogger<MessageHub> _logger;
    
    public MessageHub(IMediator mediator, ILogger<MessageHub> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }
    
    /// <summary>
    /// Called when a client connects
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var userRole = GetUserRole();
        
        _logger.LogInformation(
            "User {UserId} ({Role}) connected to messaging hub. ConnectionId: {ConnectionId}",
            userId, userRole, Context.ConnectionId);
        
        // Add user to their personal group for targeted messages
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        
        // Add admins to admin group for broadcasts
        if (userRole is UserRole.Admin or UserRole.ComplianceManager or UserRole.Reviewer)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }
        
        await base.OnConnectedAsync();
    }
    
    /// <summary>
    /// Called when a client disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        
        _logger.LogInformation(
            "User {UserId} disconnected from messaging hub. ConnectionId: {ConnectionId}",
            userId, Context.ConnectionId);
        
        await base.OnDisconnectedAsync(exception);
    }
    
    /// <summary>
    /// Send a message to another user
    /// </summary>
    public async Task SendMessage(Guid applicationId, string content, Guid? receiverId = null)
    {
        try
        {
            var senderId = GetUserId();
            var senderName = GetUserName();
            var senderRole = GetUserRole();
            
            _logger.LogInformation(
                "User {SenderId} sending message in application {ApplicationId}",
                senderId, applicationId);
            
            // Send via MediatR command (stores in database)
            var command = new SendMessageCommand(
                applicationId,
                senderId,
                senderName,
                senderRole,
                content,
                receiverId
            );
            
            var result = await _mediator.Send(command);
            
            if (!result.Success)
            {
                await Clients.Caller.SendAsync("MessageError", result.ErrorMessage);
                return;
            }
            
            // Broadcast to thread participants
            var messageDto = new
            {
                id = result.MessageId,
                threadId = result.ThreadId,
                applicationId,
                senderId,
                senderName,
                senderRole = senderRole.ToString(),
                content,
                sentAt = DateTime.UtcNow
            };
            
            // Send to receiver if specified
            if (receiverId.HasValue)
            {
                await Clients.Group($"user_{receiverId.Value}")
                    .SendAsync("ReceiveMessage", messageDto);
            }
            else
            {
                // Broadcast to all admins if no specific receiver
                await Clients.Group("admins")
                    .SendAsync("ReceiveMessage", messageDto);
            }
            
            // Confirm to sender
            await Clients.Caller.SendAsync("MessageSent", messageDto);
            
            _logger.LogInformation(
                "Message {MessageId} sent successfully",
                result.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            await Clients.Caller.SendAsync("MessageError", "Failed to send message");
        }
    }
    
    /// <summary>
    /// Mark message as read
    /// </summary>
    public async Task MarkAsRead(Guid messageId)
    {
        try
        {
            var userId = GetUserId();
            
            var command = new MarkMessageAsReadCommand(messageId, userId);
            var result = await _mediator.Send(command);
            
            if (result.Success)
            {
                await Clients.Caller.SendAsync("MessageRead", messageId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message as read");
        }
    }
    
    /// <summary>
    /// User is typing indicator
    /// </summary>
    public async Task UserTyping(Guid threadId)
    {
        var userId = GetUserId();
        var userName = GetUserName();
        
        // Broadcast typing indicator to all users in thread
        await Clients.OthersInGroup($"thread_{threadId}")
            .SendAsync("UserTyping", new { userId, userName, threadId });
    }
    
    /// <summary>
    /// Join a specific thread for real-time updates
    /// </summary>
    public async Task JoinThread(Guid threadId)
    {
        try
        {
            var userId = GetUserId();
            
            // Validate threadId is not empty
            if (threadId == Guid.Empty)
            {
                _logger.LogWarning("Attempted to join thread with empty GUID. ConnectionId: {ConnectionId}", Context.ConnectionId);
                throw new ArgumentException("Thread ID cannot be empty", nameof(threadId));
            }
            
            // Validate userId is not empty
            if (userId == Guid.Empty)
            {
                _logger.LogWarning("User ID is empty when attempting to join thread {ThreadId}. ConnectionId: {ConnectionId}", 
                    threadId, Context.ConnectionId);
                throw new UnauthorizedAccessException("User ID could not be determined from authentication claims");
            }
            
            await Groups.AddToGroupAsync(Context.ConnectionId, $"thread_{threadId}");
            _logger.LogDebug("User {UserId} joined thread {ThreadId}", userId, threadId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining thread {ThreadId}", threadId);
            throw;
        }
    }
    
    /// <summary>
    /// Leave a thread
    /// </summary>
    public async Task LeaveThread(Guid threadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"thread_{threadId}");
        _logger.LogDebug("User {UserId} left thread {ThreadId}", GetUserId(), threadId);
    }
    
    // Helper methods
    private Guid GetUserId()
    {
        // CRITICAL: Always generate user ID from email to ensure consistency across Keycloak and Azure AD
        // Keycloak provides 'preferred_username' or 'email' claim
        // Azure AD provides 'upn' or 'email' claim
        var email = Context.User?.FindFirst("email")?.Value ??
                   Context.User?.FindFirst("preferred_username")?.Value ?? // Keycloak
                   Context.User?.FindFirst("upn")?.Value ?? // Azure AD
                   Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        
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
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Email", out var emailHeader) == true)
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
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Id", out var headerUserId) == true)
        {
            if (Guid.TryParse(headerUserId.ToString(), out var guid))
            {
                _logger.LogWarning("Using X-User-Id header as fallback - this should not happen in production");
                return guid;
            }
        }
        
        _logger.LogWarning("Could not determine user ID from claims or headers. ConnectionId: {ConnectionId}", Context.ConnectionId);
        return Guid.Empty;
    }
    
    private string GetUserName()
    {
        var name = Context.User?.FindFirst("name")?.Value ?? 
                   Context.User?.FindFirst("preferred_username")?.Value;
        
        if (!string.IsNullOrEmpty(name))
            return name;
        
        // In development mode, try to get from headers
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Name", out var headerName) == true)
            return headerName.ToString();
        
        return "Unknown User";
    }
    
    private UserRole GetUserRole()
    {
        var roles = Context.User?.FindAll("role").Select(c => c.Value).ToList() ?? new List<string>();
        
        _logger.LogDebug("JWT roles found in hub: {Roles}", string.Join(", ", roles));
        
        if (roles.Contains("Admin") || roles.Contains("Administrator")) 
        {
            _logger.LogDebug("Role determined as Admin from JWT claims");
            return UserRole.Admin;
        }
        if (roles.Contains("ComplianceManager")) 
        {
            _logger.LogDebug("Role determined as ComplianceManager from JWT claims");
            return UserRole.ComplianceManager;
        }
        if (roles.Contains("Reviewer")) 
        {
            _logger.LogDebug("Role determined as Reviewer from JWT claims");
            return UserRole.Reviewer;
        }
        
        // In development mode, try to get from headers
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Role", out var headerRole) == true)
        {
            var roleStr = headerRole.ToString().ToUpperInvariant();
            _logger.LogDebug("Header role found in hub: {HeaderRole}", roleStr);
            
            if (roleStr.Contains("ADMIN")) 
            {
                _logger.LogDebug("Role determined as Admin from header");
                return UserRole.Admin;
            }
            if (roleStr.Contains("COMPLIANCE")) 
            {
                _logger.LogDebug("Role determined as ComplianceManager from header");
                return UserRole.ComplianceManager;
            }
            if (roleStr.Contains("REVIEWER")) 
            {
                _logger.LogDebug("Role determined as Reviewer from header");
                return UserRole.Reviewer;
            }
        }
        
        _logger.LogWarning("No admin role found in hub, defaulting to Applicant");
        return UserRole.Applicant;
    }
    
    /// <summary>
    /// Generate a deterministic GUID from email using UUID v5 algorithm
}

