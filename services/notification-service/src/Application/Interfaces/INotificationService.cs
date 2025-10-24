using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;

namespace NotificationService.Application.Interfaces;

/// <summary>
/// High-level notification service interface
/// Provides convenient methods for sending notifications
/// </summary>
public interface INotificationService
{
    Task SendEmailAsync(
        string to,
        string subject,
        string templateName,
        object data,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default);

    Task SendSmsAsync(
        string recipient,
        string message,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default);

    Task SendWebhookAsync(
        string url,
        object payload,
        CancellationToken cancellationToken = default);

    Task ScheduleNotificationAsync(
        NotificationType type,
        NotificationChannel channel,
        string recipient,
        string subject,
        string content,
        DateTime scheduledAt,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default);
}

