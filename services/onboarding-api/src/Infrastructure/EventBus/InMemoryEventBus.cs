using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;

namespace OnboardingApi.Infrastructure.EventBus;

/// <summary>
/// In-memory event bus implementation (no-op, events are logged but not published)
/// Replaces Kafka for simpler deployments without message broker infrastructure
/// </summary>
public class InMemoryEventBus : IEventBus
{
    private readonly ILogger<InMemoryEventBus> _logger;

    public InMemoryEventBus(ILogger<InMemoryEventBus> logger)
    {
        _logger = logger;
    }

    public Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent
    {
        var eventType = @event.GetType().Name;
        
        // Extract trace ID from current context if available
        var traceId = System.Diagnostics.Activity.Current?.Id ?? 
                      System.Diagnostics.Activity.Current?.RootId ?? 
                      Guid.NewGuid().ToString();

        _logger.LogInformation(
            "Event published (in-memory): {EventType} with EventId {EventId}, TraceId {TraceId}",
            eventType,
            @event.EventId,
            traceId);

        // Events are logged but not actually published to any message broker
        // This is a no-op implementation for deployments without Kafka
        return Task.CompletedTask;
    }

    public Task PublishIntegrationEventAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        _logger.LogInformation(
            "Integration event published (in-memory): {EventType} with EventId {EventId}",
            @event.EventType,
            @event.EventId);

        // Events are logged but not actually published to any message broker
        // This is a no-op implementation for deployments without Kafka
        return Task.CompletedTask;
    }
}

