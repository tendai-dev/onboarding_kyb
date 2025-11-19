using MediatR;
using NotificationService.Application.Interfaces;

namespace NotificationService.Application.Queries;

public record GetNotificationsByStatusQuery(string Status) : IRequest<IEnumerable<NotificationDto>>;

public class GetNotificationsByStatusQueryHandler : IRequestHandler<GetNotificationsByStatusQuery, IEnumerable<NotificationDto>>
{
    private readonly INotificationRepository _repository;

    public GetNotificationsByStatusQueryHandler(INotificationRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<NotificationDto>> Handle(GetNotificationsByStatusQuery request, CancellationToken cancellationToken)
    {
        var list = await _repository.ListByStatusAsync(request.Status, cancellationToken);
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
