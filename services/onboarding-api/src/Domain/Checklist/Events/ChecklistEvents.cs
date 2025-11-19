using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Domain.Checklist.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record ChecklistCreatedEvent(
    Guid ChecklistId,
    Guid CaseId,
    EntityType EntityType,
    RiskTier RiskTier,
    int ItemCount,
    DateTime CreatedAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt => CreatedAt;
}

public record ChecklistItemCompletedEvent(
    Guid ChecklistId,
    Guid ItemId,
    string ItemName,
    bool IsValid,
    decimal Score,
    DateTime CompletedAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt => CompletedAt;
}

public record ChecklistItemSkippedEvent(
    Guid ChecklistId,
    Guid ItemId,
    string ItemName,
    string Reason,
    DateTime SkippedAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt => SkippedAt;
}

public record ChecklistItemResetEvent(
    Guid ChecklistId,
    Guid ItemId,
    string ItemName,
    DateTime ResetAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt => ResetAt;
}

public record ChecklistCompletedEvent(
    Guid ChecklistId,
    Guid CaseId,
    decimal TotalScore,
    DateTime CompletedAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt => CompletedAt;
}

