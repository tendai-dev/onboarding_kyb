using System.Collections.Concurrent;
using System.Reflection;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;

namespace OnboardingApi.Infrastructure.EventBus;

/// <summary>
/// Dispatches domain events to their registered handlers.
/// Supports both strongly-typed dispatch and deserialization from JSON (for outbox processing).
/// </summary>
public class DomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DomainEventDispatcher> _logger;
    
    // Cache of event type name -> Type for deserialization
    private static readonly ConcurrentDictionary<string, Type?> EventTypeCache = new();
    
    // Assembly containing domain events for type resolution
    private static readonly Assembly DomainAssembly = typeof(IDomainEvent).Assembly;

    public DomainEventDispatcher(
        IServiceProvider serviceProvider,
        ILogger<DomainEventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        var eventType = domainEvent.GetType();
        var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(eventType);
        
        // Get all registered handlers for this event type
        var handlers = _serviceProvider.GetServices(handlerType);
        
        var handlerCount = 0;
        foreach (var handler in handlers)
        {
            if (handler == null) continue;
            
            try
            {
                handlerCount++;
                var handleMethod = handlerType.GetMethod("HandleAsync");
                if (handleMethod != null)
                {
                    var task = (Task?)handleMethod.Invoke(handler, new object[] { domainEvent, cancellationToken });
                    if (task != null)
                    {
                        await task;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Error in event handler {HandlerType} for event {EventType} with EventId {EventId}",
                    handler.GetType().Name, eventType.Name, domainEvent.EventId);
                // Continue processing other handlers - don't let one failure stop others
            }
        }
        
        if (handlerCount > 0)
        {
            _logger.LogDebug(
                "Dispatched event {EventType} with EventId {EventId} to {HandlerCount} handler(s)",
                eventType.Name, domainEvent.EventId, handlerCount);
        }
        else
        {
            _logger.LogDebug(
                "No handlers registered for event {EventType} with EventId {EventId}",
                eventType.Name, domainEvent.EventId);
        }
    }

    public async Task DispatchAsync(string eventTypeName, string jsonPayload, CancellationToken cancellationToken = default)
    {
        // Resolve the event type from the type name
        var eventType = ResolveEventType(eventTypeName);
        if (eventType == null)
        {
            _logger.LogWarning(
                "Unknown event type: {EventTypeName}. Event will be marked as processed but not dispatched.",
                eventTypeName);
            return;
        }

        // Deserialize the event
        IDomainEvent? domainEvent;
        try
        {
            var deserializedObject = JsonSerializer.Deserialize(jsonPayload, eventType, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            });
            
            domainEvent = deserializedObject as IDomainEvent;
            if (domainEvent == null)
            {
                _logger.LogWarning(
                    "Failed to deserialize event {EventTypeName}: result was null or not IDomainEvent",
                    eventTypeName);
                return;
            }
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, 
                "Failed to deserialize event {EventTypeName} from JSON payload",
                eventTypeName);
            return;
        }

        // Dispatch the deserialized event
        await DispatchAsync(domainEvent, cancellationToken);
    }

    private static Type? ResolveEventType(string eventTypeName)
    {
        return EventTypeCache.GetOrAdd(eventTypeName, name =>
        {
            // Try to find the type in the domain assembly
            var type = DomainAssembly.GetTypes()
                .FirstOrDefault(t => t.Name == name && typeof(IDomainEvent).IsAssignableFrom(t));
            
            return type;
        });
    }
}
