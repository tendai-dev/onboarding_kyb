using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;

namespace NotificationService.Application.Interfaces;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(NotificationId id, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetPendingAsync(CancellationToken cancellationToken = default);
    Task<List<Notification>> GetScheduledAsync(DateTime upTo, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetFailedRetryableAsync(CancellationToken cancellationToken = default);
    Task<List<Notification>> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface INotificationSender
{
    Task SendAsync(Notification notification, CancellationToken cancellationToken = default);
}

public interface IEmailSender
{
    Task SendEmailAsync(string to, string subject, string content, CancellationToken cancellationToken = default);
}

public interface ISmsSender
{
    Task SendSmsAsync(string to, string message, CancellationToken cancellationToken = default);
}
