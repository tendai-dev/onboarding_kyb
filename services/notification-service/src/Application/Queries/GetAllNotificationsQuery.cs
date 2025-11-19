using MediatR;
using NotificationService.Application.Interfaces;

namespace NotificationService.Application.Queries;

// Reuse NotificationDto from GetNotificationsByCaseQuery

public record GetAllNotificationsQuery : IRequest<IEnumerable<NotificationDto>>;

public class GetAllNotificationsQueryHandler : IRequestHandler<GetAllNotificationsQuery, IEnumerable<NotificationDto>>
{
    private readonly INotificationRepository _repository;

    public GetAllNotificationsQueryHandler(INotificationRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<NotificationDto>> Handle(GetAllNotificationsQuery request, CancellationToken cancellationToken)
    {
        var notifications = await _repository.GetAllAsync(cancellationToken);
        
        return notifications.Select(n => new NotificationDto
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

