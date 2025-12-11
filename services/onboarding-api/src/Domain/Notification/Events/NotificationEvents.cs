namespace OnboardingApi.Domain.Notification.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record NotificationCreatedEvent(
    Guid NotificationId,
    string Type,
    string Channel,
    string Recipient,
    string? CaseId,
    string? PartnerId) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record NotificationSendingEvent(
    Guid NotificationId,
    string Recipient,
    string Channel) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record NotificationSentEvent(
    Guid NotificationId,
    string Recipient,
    string Channel,
    DateTime SentAt) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = SentAt;
}

public record NotificationDeliveredEvent(
    Guid NotificationId,
    string Recipient,
    string Channel,
    DateTime DeliveredAt) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DeliveredAt;
}

public record NotificationFailedEvent(
    Guid NotificationId,
    string Recipient,
    string Channel,
    string ErrorMessage,
    int RetryCount) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record NotificationRetryEvent(
    Guid NotificationId,
    string Recipient,
    int RetryCount) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

