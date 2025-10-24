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
        await Groups.AddToGroupAsync(Context.ConnectionId, $"thread_{threadId}");
        _logger.LogDebug("User {UserId} joined thread {ThreadId}", GetUserId(), threadId);
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
        var userIdClaim = Context.User?.FindFirst("sub") ?? 
                         Context.User?.FindFirst("oid") ?? 
                         Context.User?.FindFirst("user_id");
        return Guid.TryParse(userIdClaim?.Value, out var userId) ? userId : Guid.Empty;
    }
    
    private string GetUserName()
    {
        return Context.User?.FindFirst("name")?.Value ?? 
               Context.User?.FindFirst("preferred_username")?.Value ?? 
               "Unknown User";
    }
    
    private UserRole GetUserRole()
    {
        var roles = Context.User?.FindAll("role").Select(c => c.Value).ToList() ?? new List<string>();
        
        if (roles.Contains("Admin")) return UserRole.Admin;
        if (roles.Contains("ComplianceManager")) return UserRole.ComplianceManager;
        if (roles.Contains("Reviewer")) return UserRole.Reviewer;
        
        return UserRole.Applicant;
    }
}

