using Microsoft.AspNetCore.SignalR;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Presentation.Hubs;

namespace OnboardingApi.Presentation.Services;

/// <summary>
/// SignalR implementation of IMessageBroadcaster
/// Bridges the Application layer with SignalR without creating circular dependencies
/// </summary>
public class MessageBroadcaster : IMessageBroadcaster
{
    private readonly IHubContext<MessagingHub> _hubContext;
    private readonly ILogger<MessageBroadcaster> _logger;

    public MessageBroadcaster(
        IHubContext<MessagingHub> hubContext,
        ILogger<MessageBroadcaster> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task BroadcastMessageAsync(string threadId, object messageDto, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"thread-{threadId}")
                .SendAsync("ReceiveMessage", messageDto, cancellationToken);
            
            _logger.LogDebug("Broadcasted message to thread {ThreadId}", threadId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast message to thread {ThreadId}", threadId);
            throw;
        }
    }

    public async Task NotifyUserAsync(string userId, object notification, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients.Group($"user-{userId}")
                .SendAsync("MessageSent", notification, cancellationToken);
            
            _logger.LogDebug("Notified user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to notify user {UserId}", userId);
            throw;
        }
    }
}

