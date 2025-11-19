using MediatR;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;

namespace NotificationService.Application.Queries;

public record GetNotificationTemplatesQuery(bool? ActiveOnly = null) : IRequest<IEnumerable<NotificationTemplateDto>>;

public class NotificationTemplateDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Channel { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public List<string> Recipients { get; init; } = new();
    public string Trigger { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public string Frequency { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string? CreatedBy { get; init; }
}

public class GetNotificationTemplatesQueryHandler : IRequestHandler<GetNotificationTemplatesQuery, IEnumerable<NotificationTemplateDto>>
{
    private readonly INotificationTemplateRepository _repository;

    public GetNotificationTemplatesQueryHandler(INotificationTemplateRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<NotificationTemplateDto>> Handle(GetNotificationTemplatesQuery request, CancellationToken cancellationToken)
    {
        var templates = request.ActiveOnly == true
            ? await _repository.GetActiveAsync(cancellationToken)
            : await _repository.GetAllAsync(cancellationToken);

        return templates.Select(t => new NotificationTemplateDto
        {
            Id = t.Id.Value,
            Name = t.Name,
            Description = t.Description,
            Type = t.Type.ToString(),
            Channel = t.Channel.ToString(),
            Subject = t.Subject,
            Content = t.Content,
            Recipients = t.Recipients,
            Trigger = t.Trigger,
            Priority = t.Priority.ToString(),
            IsActive = t.IsActive,
            Frequency = t.Frequency.ToString(),
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            CreatedBy = t.CreatedBy
        });
    }
}

