using MediatR;
using OnboardingApi.Application.Notification.Interfaces;

namespace OnboardingApi.Application.Notification.Queries;

public record GetAllNotificationsQuery : IRequest<IEnumerable<NotificationDto>>;

public record GetNotificationsByCaseQuery(string CaseId) : IRequest<IEnumerable<NotificationDto>>;

public record GetNotificationsByStatusQuery(string Status) : IRequest<IEnumerable<NotificationDto>>;

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
            Priority = n.Priority.ToString(),
            CaseId = n.CaseId,
            PartnerId = n.PartnerId,
            TemplateId = n.TemplateId,
            TemplateData = n.TemplateData,
            CreatedAt = n.CreatedAt,
            ScheduledAt = n.ScheduledAt,
            SentAt = n.SentAt,
            DeliveredAt = n.DeliveredAt,
            FailedAt = n.FailedAt,
            ErrorMessage = n.ErrorMessage,
            RetryCount = n.RetryCount
        });
    }
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
        var notifications = await _repository.ListByCaseIdAsync(request.CaseId, cancellationToken);
        
        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id.Value,
            Type = n.Type.ToString(),
            Channel = n.Channel.ToString(),
            Recipient = n.Recipient,
            Subject = n.Subject,
            Content = n.Content,
            Status = n.Status.ToString(),
            Priority = n.Priority.ToString(),
            CaseId = n.CaseId,
            PartnerId = n.PartnerId,
            TemplateId = n.TemplateId,
            TemplateData = n.TemplateData,
            CreatedAt = n.CreatedAt,
            ScheduledAt = n.ScheduledAt,
            SentAt = n.SentAt,
            DeliveredAt = n.DeliveredAt,
            FailedAt = n.FailedAt,
            ErrorMessage = n.ErrorMessage,
            RetryCount = n.RetryCount
        });
    }
}

public class GetNotificationsByStatusQueryHandler : IRequestHandler<GetNotificationsByStatusQuery, IEnumerable<NotificationDto>>
{
    private readonly INotificationRepository _repository;

    public GetNotificationsByStatusQueryHandler(INotificationRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<NotificationDto>> Handle(GetNotificationsByStatusQuery request, CancellationToken cancellationToken)
    {
        var notifications = await _repository.ListByStatusAsync(request.Status, cancellationToken);
        
        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id.Value,
            Type = n.Type.ToString(),
            Channel = n.Channel.ToString(),
            Recipient = n.Recipient,
            Subject = n.Subject,
            Content = n.Content,
            Status = n.Status.ToString(),
            Priority = n.Priority.ToString(),
            CaseId = n.CaseId,
            PartnerId = n.PartnerId,
            TemplateId = n.TemplateId,
            TemplateData = n.TemplateData,
            CreatedAt = n.CreatedAt,
            ScheduledAt = n.ScheduledAt,
            SentAt = n.SentAt,
            DeliveredAt = n.DeliveredAt,
            FailedAt = n.FailedAt,
            ErrorMessage = n.ErrorMessage,
            RetryCount = n.RetryCount
        });
    }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? CaseId { get; set; }
    public string? PartnerId { get; set; }
    public string? TemplateId { get; set; }
    public Dictionary<string, object> TemplateData { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
}

