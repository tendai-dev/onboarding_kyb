using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace NotificationService.Infrastructure.Services;

public class NotificationSender : INotificationSender
{
    private readonly IEmailSender _emailSender;
    private readonly ISmsSender _smsSender;
    private readonly INotificationRepository _repository;
    private readonly ILogger<NotificationSender> _logger;

    public NotificationSender(
        IEmailSender emailSender,
        ISmsSender smsSender,
        INotificationRepository repository,
        ILogger<NotificationSender> logger)
    {
        _emailSender = emailSender;
        _smsSender = smsSender;
        _repository = repository;
        _logger = logger;
    }

    public async Task SendAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        try
        {
            notification.MarkAsSending();
            await _repository.UpdateAsync(notification, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            switch (notification.Channel)
            {
                case NotificationChannel.Email:
                    await _emailSender.SendEmailAsync(
                        notification.Recipient,
                        notification.Subject,
                        notification.Content,
                        cancellationToken);
                    break;

                case NotificationChannel.SMS:
                    await _smsSender.SendSmsAsync(
                        notification.Recipient,
                        notification.Content,
                        cancellationToken);
                    break;

                case NotificationChannel.InApp:
                case NotificationChannel.Push:
                case NotificationChannel.Webhook:
                    // These would be implemented based on specific requirements
                    _logger.LogWarning("Channel {Channel} not yet implemented", notification.Channel);
                    break;

                default:
                    throw new NotSupportedException($"Notification channel {notification.Channel} is not supported");
            }

            notification.MarkAsSent();
            await _repository.UpdateAsync(notification, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Notification {NotificationId} sent successfully via {Channel} to {Recipient}",
                notification.Id.Value,
                notification.Channel,
                notification.Recipient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send notification {NotificationId} via {Channel} to {Recipient}",
                notification.Id.Value,
                notification.Channel,
                notification.Recipient);

            notification.MarkAsFailed(ex.Message);
            await _repository.UpdateAsync(notification, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            throw;
        }
    }
}

public class EmailSender : IEmailSender
{
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(ILogger<EmailSender> logger)
    {
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string content, CancellationToken cancellationToken = default)
    {
        // Simplified implementation - in production, use MailKit/SendGrid/AWS SES
        _logger.LogInformation("Sending email to {To} with subject '{Subject}'", to, subject);
        
        // Simulate email sending
        await Task.Delay(100, cancellationToken);
        
        _logger.LogInformation("Email sent successfully to {To}", to);
    }
}

public class SmsSender : ISmsSender
{
    private readonly ILogger<SmsSender> _logger;

    public SmsSender(ILogger<SmsSender> logger)
    {
        _logger = logger;
    }

    public async Task SendSmsAsync(string to, string message, CancellationToken cancellationToken = default)
    {
        // Simplified implementation - in production, use Twilio/AWS SNS
        _logger.LogInformation("Sending SMS to {To} with message length {Length}", to, message.Length);
        
        // Simulate SMS sending
        await Task.Delay(50, cancellationToken);
        
        _logger.LogInformation("SMS sent successfully to {To}", to);
    }
}
