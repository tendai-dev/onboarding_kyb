using MediatR;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;

namespace NotificationService.Application.Commands;

public record DeleteNotificationTemplateCommand(
    Guid TemplateId
) : IRequest<DeleteNotificationTemplateResult>;

public record DeleteNotificationTemplateResult(
    bool Success
);

public class DeleteNotificationTemplateCommandHandler : IRequestHandler<DeleteNotificationTemplateCommand, DeleteNotificationTemplateResult>
{
    private readonly INotificationTemplateRepository _repository;

    public DeleteNotificationTemplateCommandHandler(INotificationTemplateRepository repository)
    {
        _repository = repository;
    }

    public async Task<DeleteNotificationTemplateResult> Handle(DeleteNotificationTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await _repository.GetByIdAsync(NotificationTemplateId.From(request.TemplateId), cancellationToken);
        if (template == null)
            throw new InvalidOperationException($"Template with ID {request.TemplateId} not found");

        await _repository.DeleteAsync(template, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new DeleteNotificationTemplateResult(true);
    }
}

