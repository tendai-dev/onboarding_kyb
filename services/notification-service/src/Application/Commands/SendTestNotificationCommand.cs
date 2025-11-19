using MediatR;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;

namespace NotificationService.Application.Commands;

public record SendTestNotificationCommand(
    Guid TemplateId,
    string TestRecipient
) : IRequest<SendTestNotificationResult>;

public record SendTestNotificationResult(
    Guid NotificationId,
    bool Success
);

public class SendTestNotificationCommandHandler : IRequestHandler<SendTestNotificationCommand, SendTestNotificationResult>
{
    private readonly INotificationTemplateRepository _templateRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSender _notificationSender;

    public SendTestNotificationCommandHandler(
        INotificationTemplateRepository templateRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender)
    {
        _templateRepository = templateRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
    }

    public async Task<SendTestNotificationResult> Handle(SendTestNotificationCommand request, CancellationToken cancellationToken)
    {
        var template = await _templateRepository.GetByIdAsync(NotificationTemplateId.From(request.TemplateId), cancellationToken);
        if (template == null)
            throw new InvalidOperationException($"Template with ID {request.TemplateId} not found");

        // Create a notification from the template
        var notification = Notification.Create(
            template.Type,
            template.Channel,
            request.TestRecipient,
            template.Subject,
            template.Content,
            template.Priority,
            null, // caseId
            null, // partnerId
            template.Id.Value.ToString(), // templateId
            null, // templateData
            null); // scheduledAt

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _notificationRepository.SaveChangesAsync(cancellationToken);

        // Send the notification
        try
        {
            await _notificationSender.SendAsync(notification, cancellationToken);
            await _notificationRepository.UpdateAsync(notification, cancellationToken);
            await _notificationRepository.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            notification.MarkAsFailed(ex.Message);
            await _notificationRepository.UpdateAsync(notification, cancellationToken);
            await _notificationRepository.SaveChangesAsync(cancellationToken);
            throw;
        }

        return new SendTestNotificationResult(
            notification.Id.Value,
            notification.Status == NotificationStatus.Sent || notification.Status == NotificationStatus.Delivered);
    }
}

