using MediatR;
using OnboardingApi.Domain.Notification.ValueObjects;

namespace OnboardingApi.Application.Notification.Commands;

public record SendNotificationCommand(
    NotificationType Type,
    NotificationChannel Channel,
    string Recipient,
    string Subject,
    string Content,
    NotificationPriority Priority = NotificationPriority.Medium,
    string? CaseId = null,
    string? PartnerId = null,
    string? TemplateId = null,
    Dictionary<string, object>? TemplateData = null,
    DateTime? ScheduledAt = null) : IRequest<SendNotificationResult>;

public record SendNotificationResult(
    Guid NotificationId,
    string Status,
    DateTime CreatedAt);

