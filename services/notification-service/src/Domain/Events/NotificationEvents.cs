using MediatR;

namespace NotificationService.Domain.Events;

public record NotificationCreatedEvent(
    Guid NotificationId,
    string Type,
    string Channel,
    string Recipient,
    string? CaseId,
    string? PartnerId) : INotification;

public record NotificationSendingEvent(
    Guid NotificationId,
    string Recipient,
    string Channel) : INotification;

public record NotificationSentEvent(
    Guid NotificationId,
    string Recipient,
    string Channel,
    DateTime SentAt) : INotification;

public record NotificationDeliveredEvent(
    Guid NotificationId,
    string Recipient,
    string Channel,
    DateTime DeliveredAt) : INotification;

public record NotificationFailedEvent(
    Guid NotificationId,
    string Recipient,
    string Channel,
    string ErrorMessage,
    int RetryCount) : INotification;

public record NotificationRetryEvent(
    Guid NotificationId,
    string Recipient,
    int RetryCount) : INotification;
