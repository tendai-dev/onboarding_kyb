using System.Text.Json;
using OnboardingApi.Domain.Events;

namespace OnboardingApi.Infrastructure.Persistence;

/// <summary>
/// Extension methods for saving domain events to the outbox table within the same transaction.
/// This ensures events are persisted atomically with domain changes (transactional outbox pattern).
/// </summary>
public static class OutboxDbContextExtensions
{
    /// <summary>
    /// Adds domain events to the outbox table. Call this BEFORE SaveChangesAsync
    /// to ensure events are saved in the same transaction as domain changes.
    /// </summary>
    public static void AddToOutbox(this OnboardingDbContext context, Guid aggregateId, string aggregateType, IEnumerable<IDomainEvent> events)
    {
        foreach (var domainEvent in events)
        {
            var outboxEvent = new OutboxEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = aggregateId,
                AggregateType = aggregateType,
                EventType = domainEvent.GetType().Name,
                Payload = JsonSerializer.Serialize(domainEvent, domainEvent.GetType(), new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                }),
                OccurredAt = domainEvent.OccurredAt,
                ProcessedAt = null
            };

            context.OutboxEvents.Add(outboxEvent);
        }
    }

    /// <summary>
    /// Adds a single domain event to the outbox table.
    /// </summary>
    public static void AddToOutbox(this OnboardingDbContext context, Guid aggregateId, string aggregateType, IDomainEvent domainEvent)
    {
        context.AddToOutbox(aggregateId, aggregateType, new[] { domainEvent });
    }
}
