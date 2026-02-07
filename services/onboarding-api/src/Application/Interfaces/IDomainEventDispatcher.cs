using OnboardingApi.Domain.Events;

namespace OnboardingApi.Application.Interfaces;

/// <summary>
/// Dispatches domain events to their registered handlers asynchronously.
/// Used by the OutboxEventProcessor to process events in the background.
/// </summary>
public interface IDomainEventDispatcher
{
    /// <summary>
    /// Dispatches a domain event to all registered handlers.
    /// </summary>
    Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Dispatches a domain event by its type name and JSON payload.
    /// Used when deserializing events from the outbox table.
    /// </summary>
    Task DispatchAsync(string eventTypeName, string jsonPayload, CancellationToken cancellationToken = default);
}

/// <summary>
/// Handler interface for domain events.
/// Implement this interface to handle specific domain events asynchronously.
/// </summary>
/// <typeparam name="TEvent">The type of domain event to handle</typeparam>
public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    /// <summary>
    /// Handles the domain event.
    /// </summary>
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken = default);
}
