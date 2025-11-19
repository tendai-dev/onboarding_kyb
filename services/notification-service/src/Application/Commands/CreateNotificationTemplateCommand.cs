using MediatR;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;

namespace NotificationService.Application.Commands;

public record CreateNotificationTemplateCommand(
    string Name,
    string Description,
    string Type,
    string Channel,
    string Subject,
    string Content,
    List<string> Recipients,
    string Trigger,
    string Priority = "Medium",
    string Frequency = "Immediate",
    string? CreatedBy = null
) : IRequest<CreateNotificationTemplateResult>;

public record CreateNotificationTemplateResult(
    Guid TemplateId,
    string Name
);

public class CreateNotificationTemplateCommandHandler : IRequestHandler<CreateNotificationTemplateCommand, CreateNotificationTemplateResult>
{
    private readonly INotificationTemplateRepository _repository;

    public CreateNotificationTemplateCommandHandler(INotificationTemplateRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateNotificationTemplateResult> Handle(CreateNotificationTemplateCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<NotificationType>(request.Type, out var type))
            throw new ArgumentException($"Invalid notification type: {request.Type}");

        if (!Enum.TryParse<NotificationChannel>(request.Channel, out var channel))
            throw new ArgumentException($"Invalid notification channel: {request.Channel}");

        if (!Enum.TryParse<NotificationPriority>(request.Priority, out var priority))
            priority = NotificationPriority.Medium;

        if (!Enum.TryParse<NotificationFrequency>(request.Frequency, out var frequency))
            frequency = NotificationFrequency.Immediate;

        var template = NotificationTemplate.Create(
            request.Name,
            request.Description,
            type,
            channel,
            request.Subject,
            request.Content,
            request.Recipients,
            request.Trigger,
            priority,
            frequency,
            request.CreatedBy);

        await _repository.AddAsync(template, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CreateNotificationTemplateResult(
            template.Id.Value,
            template.Name);
    }
}

