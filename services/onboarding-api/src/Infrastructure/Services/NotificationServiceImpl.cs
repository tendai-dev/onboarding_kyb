using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Implementation of high-level notification service
/// </summary>
public class NotificationServiceImpl : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly INotificationSender _sender;
    private readonly ILogger<NotificationServiceImpl> _logger;

    public NotificationServiceImpl(
        INotificationRepository repository,
        INotificationSender sender,
        ILogger<NotificationServiceImpl> logger)
    {
        _repository = repository;
        _sender = sender;
        _logger = logger;
    }

    public async Task SendEmailAsync(
        string to,
        string subject,
        string templateName,
        object data,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default)
    {
        // Convert template data to dictionary
        var templateData = data.GetType()
            .GetProperties()
            .ToDictionary(p => p.Name, p => p.GetValue(data) ?? string.Empty);

        // For now, use template name as content (in production, would load from template repository)
        var content = $"Template: {templateName}\nData: {System.Text.Json.JsonSerializer.Serialize(templateData)}";

        var notification = Notification.Create(
            NotificationType.Other,
            NotificationChannel.Email,
            to,
            subject,
            content,
            priority,
            caseId);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        await _sender.SendAsync(notification, cancellationToken);
    }

    public async Task SendSmsAsync(
        string recipient,
        string message,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = Notification.Create(
            NotificationType.Other,
            NotificationChannel.SMS,
            recipient,
            "SMS Notification",
            message,
            priority,
            caseId);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        await _sender.SendAsync(notification, cancellationToken);
    }

    public async Task SendWebhookAsync(
        string url,
        object payload,
        CancellationToken cancellationToken = default)
    {
        // Webhook implementation would go here
        _logger.LogInformation("Webhook notification to {Url} with payload", url);
        await Task.CompletedTask;
    }

    public async Task ScheduleNotificationAsync(
        NotificationType type,
        NotificationChannel channel,
        string recipient,
        string subject,
        string content,
        DateTime scheduledAt,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = Notification.Create(
            type,
            channel,
            recipient,
            subject,
            content,
            priority,
            caseId,
            null,
            null,
            null,
            scheduledAt);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
    }
}

