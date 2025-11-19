using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;

namespace OnboardingApi.Application.Notification.Interfaces;

public interface INotificationRepository
{
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<List<Notification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<Notification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Notification?> GetByIdAsync(NotificationId id, CancellationToken cancellationToken = default);
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

