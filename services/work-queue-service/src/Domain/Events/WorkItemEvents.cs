using WorkQueueService.Domain.ValueObjects;

namespace WorkQueueService.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record WorkItemCreatedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    ValueObjects.RiskLevel RiskLevel,
    bool RequiresApproval,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemAssignedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    Guid AssignedToUserId,
    string AssignedToUserName,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemUnassignedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemReviewStartedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemSubmittedForApprovalEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    ValueObjects.RiskLevel RiskLevel,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemApprovedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    Guid ApprovedByUserId,
    string ApprovedByUserName,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemCompletedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemDeclinedEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    string Reason,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemRefreshScheduledEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    DateTime NextRefreshDate,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record WorkItemMarkedForRefreshEvent(
    Guid WorkItemId,
    Guid ApplicationId,
    int RefreshCount,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

// RiskLevel enum (imported from Domain)
public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

