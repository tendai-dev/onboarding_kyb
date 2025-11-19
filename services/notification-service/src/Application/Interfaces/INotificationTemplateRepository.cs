using NotificationService.Domain.Aggregates;

namespace NotificationService.Application.Interfaces;

public interface INotificationTemplateRepository
{
    Task<NotificationTemplate?> GetByIdAsync(NotificationTemplateId id, CancellationToken cancellationToken = default);
    Task<List<NotificationTemplate>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<NotificationTemplate>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task AddAsync(NotificationTemplate template, CancellationToken cancellationToken = default);
    Task UpdateAsync(NotificationTemplate template, CancellationToken cancellationToken = default);
    Task DeleteAsync(NotificationTemplate template, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

