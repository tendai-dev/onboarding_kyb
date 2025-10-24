using Microsoft.Extensions.Logging;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;

namespace NotificationService.Infrastructure.Services;

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
        var templateData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(
            System.Text.Json.JsonSerializer.Serialize(data)) ?? new Dictionary<string, object>();

        var notification = Notification.Create(
            NotificationType.SystemAlert,
            NotificationChannel.Email,
            to,
            subject,
            "", // Content will be generated from template
            priority,
            caseId,
            templateId: templateName,
            templateData: templateData);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        
        await _sender.SendAsync(notification, cancellationToken);
        
        _logger.LogInformation(
            "Email notification sent to {Recipient} with template {Template}",
            to, templateName);
    }

    public async Task SendWebhookAsync(
        string url,
        object payload,
        CancellationToken cancellationToken = default)
    {
        // Simple webhook implementation
        _logger.LogInformation("Webhook would be sent to {Url}", url);
        await Task.CompletedTask;
    }

    public async Task SendSmsAsync(
        string recipient,
        string message,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = Notification.Create(
            NotificationType.SystemAlert,
            NotificationChannel.SMS,
            recipient,
            "SMS Notification", // SMS doesn't have a subject
            message,
            priority,
            caseId);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        
        await _sender.SendAsync(notification, cancellationToken);
        
        _logger.LogInformation(
            "SMS notification sent to {Recipient}",
            recipient);
    }

    public async Task SendTemplatedEmailAsync(
        string recipient,
        string templateId,
        Dictionary<string, object> templateData,
        NotificationPriority priority = NotificationPriority.Medium,
        string? caseId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = Notification.Create(
            NotificationType.SystemAlert,
            NotificationChannel.Email,
            recipient,
            $"Template: {templateId}", // Will be replaced by template processor
            "", // Content will be generated from template
            priority,
            caseId,
            templateId: templateId,
            templateData: templateData);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        
        await _sender.SendAsync(notification, cancellationToken);
        
        _logger.LogInformation(
            "Templated email notification sent to {Recipient} using template {TemplateId}",
            recipient, templateId);
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
            scheduledAt: scheduledAt);

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation(
            "Notification scheduled for {ScheduledAt} to {Recipient}",
            scheduledAt, recipient);
    }
}

