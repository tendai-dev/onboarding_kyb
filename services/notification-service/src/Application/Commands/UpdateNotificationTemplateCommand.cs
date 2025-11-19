using MediatR;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;

namespace NotificationService.Application.Commands;

public record UpdateNotificationTemplateCommand(
    Guid TemplateId,
    string? Name = null,
    string? Description = null,
    string? Subject = null,
    string? Content = null,
    List<string>? Recipients = null,
    string? Trigger = null,
    string? Priority = null,
    string? Frequency = null,
    bool? IsActive = null
) : IRequest<UpdateNotificationTemplateResult>;

public record UpdateNotificationTemplateResult(
    Guid TemplateId,
    bool Success
);

public class UpdateNotificationTemplateCommandHandler : IRequestHandler<UpdateNotificationTemplateCommand, UpdateNotificationTemplateResult>
{
    private readonly INotificationTemplateRepository _repository;

    public UpdateNotificationTemplateCommandHandler(INotificationTemplateRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateNotificationTemplateResult> Handle(UpdateNotificationTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await _repository.GetByIdAsync(NotificationTemplateId.From(request.TemplateId), cancellationToken);
        if (template == null)
            throw new InvalidOperationException($"Template with ID {request.TemplateId} not found");

        NotificationPriority? priority = null;
        if (!string.IsNullOrWhiteSpace(request.Priority) && Enum.TryParse<NotificationPriority>(request.Priority, out var parsedPriority))
            priority = parsedPriority;

        NotificationFrequency? frequency = null;
        if (!string.IsNullOrWhiteSpace(request.Frequency) && Enum.TryParse<NotificationFrequency>(request.Frequency, out var parsedFrequency))
            frequency = parsedFrequency;

        template.Update(
            request.Name,
            request.Description,
            request.Subject,
            request.Content,
            request.Recipients,
            request.Trigger,
            priority,
            frequency);

        if (request.IsActive.HasValue)
        {
            if (request.IsActive.Value)
                template.Activate();
            else
                template.Deactivate();
        }

        await _repository.UpdateAsync(template, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new UpdateNotificationTemplateResult(
            template.Id.Value,
            true);
    }
}

