namespace OnboardingApi.Application.Messaging.Interfaces;

/// <summary>
/// Interface for broadcasting messages via SignalR
/// Implementation should be in the Presentation layer to avoid circular dependencies
/// </summary>
public interface IMessageBroadcaster
{
    Task BroadcastMessageAsync(string threadId, object messageDto, CancellationToken cancellationToken = default);
    Task NotifyUserAsync(string userId, object notification, CancellationToken cancellationToken = default);
}

