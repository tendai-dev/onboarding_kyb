using MediatR;
using OnboardingApi.Application.Notification.Interfaces;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Application.Notification.Commands;

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, SendNotificationResult>
{
    private readonly INotificationRepository _repository;
    private readonly INotificationSender _sender;

    public SendNotificationCommandHandler(
        INotificationRepository repository,
        INotificationSender sender)
    {
        _repository = repository;
        _sender = sender;
    }

    public async Task<SendNotificationResult> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        // Create notification
        var notification = DomainNotification.Create(
            request.Type,
            request.Channel,
            request.Recipient,
            request.Subject,
            request.Content,
            request.Priority,
            request.CaseId,
            request.PartnerId,
            request.TemplateId,
            request.TemplateData,
            request.ScheduledAt);

        // Save to repository
        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Send immediately if not scheduled
        if (!request.ScheduledAt.HasValue)
        {
            await _sender.SendAsync(notification, cancellationToken);
        }

        return new SendNotificationResult(
            notification.Id.Value,
            notification.Status.ToString(),
            notification.CreatedAt);
    }
}

