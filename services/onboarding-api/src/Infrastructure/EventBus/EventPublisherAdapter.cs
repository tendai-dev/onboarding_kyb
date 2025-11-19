using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;

namespace OnboardingApi.Infrastructure.EventBus;

/// <summary>
/// Adapter that implements IEventPublisher by wrapping IEventBus
/// </summary>
public class EventPublisherAdapter : IEventPublisher
{
    private readonly IEventBus _eventBus;

    public EventPublisherAdapter(IEventBus eventBus)
    {
        _eventBus = eventBus;
    }

    public Task PublishAsync<T>(T domainEvent, CancellationToken cancellationToken) where T : class
    {
        // IEventBus requires IDomainEvent, so we cast if possible
        if (domainEvent is IDomainEvent domainEventTyped)
        {
            return _eventBus.PublishAsync(domainEventTyped, cancellationToken);
        }
        
        // If it's not a domain event, we can't publish it via IEventBus
        // This shouldn't happen in practice, but we handle it gracefully
        throw new ArgumentException($"Type {typeof(T).Name} does not implement IDomainEvent", nameof(domainEvent));
    }
}

