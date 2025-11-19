using MediatR;
using NotificationService.Application.Interfaces;

namespace NotificationService.Application.Queries;

public record GetNotificationsByCaseQuery(string CaseId) : IRequest<IEnumerable<NotificationDto>>;

public class NotificationDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Channel { get; init; } = string.Empty;
    public string Recipient { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? CaseId { get; init; }
    public string? PartnerId { get; init; }
    public string? TemplateId { get; init; }
    public Dictionary<string, object>? TemplateData { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? SentAt { get; init; }
}

public class GetNotificationsByCaseQueryHandler : IRequestHandler<GetNotificationsByCaseQuery, IEnumerable<NotificationDto>>
{
    private readonly INotificationRepository _repository;

    public GetNotificationsByCaseQueryHandler(INotificationRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<NotificationDto>> Handle(GetNotificationsByCaseQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.ListByCaseIdAsync(request.CaseId, cancellationToken);
        return list.Select(n => new NotificationDto
        {
            Id = n.Id.Value,
            Type = n.Type.ToString(),
            Channel = n.Channel.ToString(),
            Recipient = n.Recipient,
            Subject = n.Subject,
            Content = n.Content,
            Status = n.Status.ToString(),
            CaseId = n.CaseId,
            PartnerId = n.PartnerId,
            TemplateId = n.TemplateId,
            TemplateData = n.TemplateData,
            CreatedAt = n.CreatedAt,
            SentAt = n.SentAt
        });
    }
}
