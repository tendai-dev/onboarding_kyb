using OnboardingApi.Domain.Notification.ValueObjects;
using DomainNotification = OnboardingApi.Domain.Notification.Aggregates.Notification;

namespace OnboardingApi.Application.Notification.Interfaces;

public interface INotificationRepository
{
    Task AddAsync(DomainNotification notification, CancellationToken cancellationToken = default);
    Task UpdateAsync(DomainNotification notification, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<List<DomainNotification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<DomainNotification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<List<DomainNotification>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<DomainNotification?> GetByIdAsync(NotificationId id, CancellationToken cancellationToken = default);
}

public interface INotificationSender
{
    Task SendAsync(DomainNotification notification, CancellationToken cancellationToken = default);
}

public interface IEmailSender
{
    Task SendEmailAsync(string to, string subject, string content, CancellationToken cancellationToken = default);
}

public interface ISmsSender
{
    Task SendSmsAsync(string to, string message, CancellationToken cancellationToken = default);
}

