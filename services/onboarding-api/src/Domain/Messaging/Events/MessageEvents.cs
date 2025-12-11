namespace OnboardingApi.Domain.Messaging.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record MessageSentEvent(
    Guid MessageId,
    Guid ThreadId,
    Guid ApplicationId,
    Guid SenderId,
    Guid? ReceiverId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record MessageReadEvent(
    Guid MessageId,
    Guid ThreadId,
    Guid ReadByUserId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record MessageDeletedEvent(
    Guid MessageId,
    Guid ThreadId,
    Guid DeletedByUserId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record ThreadCreatedEvent(
    Guid ThreadId,
    Guid ApplicationId,
    Guid ApplicantId,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

