using OnboardingApi.Domain.Notification.Events;
using OnboardingApi.Domain.Notification.ValueObjects;

namespace OnboardingApi.Domain.Notification.Aggregates;

public class Notification
{
    private readonly List<IDomainEvent> _domainEvents = new();

    public NotificationId Id { get; private set; }
    public NotificationType Type { get; private set; }
    public NotificationChannel Channel { get; private set; }
    public string Recipient { get; private set; }
    public string Subject { get; private set; }
    public string Content { get; private set; }
    public NotificationStatus Status { get; private set; }
    public NotificationPriority Priority { get; private set; }
    public string? CaseId { get; private set; }
    public string? PartnerId { get; private set; }
    public string? TemplateId { get; private set; }
    public Dictionary<string, object> TemplateData { get; private set; } = new();
    public DateTime CreatedAt { get; private set; }
    public DateTime? ScheduledAt { get; private set; }
    public DateTime? SentAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }
    public DateTime? FailedAt { get; private set; }
    public string? ErrorMessage { get; private set; }
    public int RetryCount { get; private set; }
    public int MaxRetries { get; private set; } = 3;
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    private Notification() { } // EF Core

    public static Notification Create(
        NotificationType type,
        NotificationChannel channel,
        string recipient,
        string subject,
        string content,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        string? partnerId = null,
        string? templateId = null,
        Dictionary<string, object>? templateData = null,
        DateTime? scheduledAt = null)
    {
        var notification = new Notification
        {
            Id = NotificationId.New(),
            Type = type,
            Channel = channel,
            Recipient = recipient,
            Subject = subject,
            Content = content,
            Status = scheduledAt.HasValue ? NotificationStatus.Scheduled : NotificationStatus.Pending,
            Priority = priority,
            CaseId = caseId,
            PartnerId = partnerId,
            TemplateId = templateId,
            TemplateData = templateData ?? new Dictionary<string, object>(),
            CreatedAt = DateTime.UtcNow,
            ScheduledAt = scheduledAt
        };

        notification.AddDomainEvent(new NotificationCreatedEvent(
            notification.Id.Value,
            notification.Type.ToString(),
            notification.Channel.ToString(),
            notification.Recipient,
            notification.CaseId,
            notification.PartnerId));

        return notification;
    }

    public void MarkAsSending()
    {
        if (Status != NotificationStatus.Pending && Status != NotificationStatus.Scheduled)
            throw new InvalidOperationException($"Cannot send notification in status {Status}");

        Status = NotificationStatus.Sending;

        AddDomainEvent(new NotificationSendingEvent(
            Id.Value,
            Recipient,
            Channel.ToString()));
    }

    public void MarkAsSent()
    {
        if (Status != NotificationStatus.Sending)
            throw new InvalidOperationException($"Cannot mark as sent notification in status {Status}");

        Status = NotificationStatus.Sent;
        SentAt = DateTime.UtcNow;

        AddDomainEvent(new NotificationSentEvent(
            Id.Value,
            Recipient,
            Channel.ToString(),
            SentAt.Value));
    }

    public void MarkAsDelivered()
    {
        if (Status != NotificationStatus.Sent)
            throw new InvalidOperationException($"Cannot mark as delivered notification in status {Status}");

        Status = NotificationStatus.Delivered;
        DeliveredAt = DateTime.UtcNow;

        AddDomainEvent(new NotificationDeliveredEvent(
            Id.Value,
            Recipient,
            Channel.ToString(),
            DeliveredAt.Value));
    }

    public void MarkAsFailed(string errorMessage)
    {
        Status = NotificationStatus.Failed;
        FailedAt = DateTime.UtcNow;
        ErrorMessage = errorMessage;
        RetryCount++;

        AddDomainEvent(new NotificationFailedEvent(
            Id.Value,
            Recipient,
            Channel.ToString(),
            errorMessage,
            RetryCount));
    }

    public void Retry()
    {
        if (Status != NotificationStatus.Failed)
            throw new InvalidOperationException($"Cannot retry notification in status {Status}");

        if (RetryCount >= MaxRetries)
            throw new InvalidOperationException($"Maximum retry count ({MaxRetries}) exceeded");

        Status = NotificationStatus.Pending;
        ErrorMessage = null;

        AddDomainEvent(new NotificationRetryEvent(
            Id.Value,
            Recipient,
            RetryCount + 1));
    }

    public bool CanRetry => Status == NotificationStatus.Failed && RetryCount < MaxRetries;

    public bool IsExpired => ScheduledAt.HasValue && ScheduledAt.Value.AddDays(7) < DateTime.UtcNow;

    private void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

