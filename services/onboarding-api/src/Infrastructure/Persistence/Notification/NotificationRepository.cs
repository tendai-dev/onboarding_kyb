using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Domain.Notification.Aggregates;
using OnboardingApi.Domain.Notification.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Notification;

namespace OnboardingApi.Infrastructure.Persistence.Notification;

public class NotificationRepository : INotificationRepository
{
    private readonly NotificationDbContext _context;

    public NotificationRepository(NotificationDbContext context)
    {
        _context = context;
    }

    public async Task<Domain.Notification.Aggregates.Notification?> GetByIdAsync(NotificationId id, CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<List<Domain.Notification.Aggregates.Notification>> ListByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .Where(n => n.CaseId == caseId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Domain.Notification.Aggregates.Notification>> ListByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .Where(n => n.Status.ToString() == status)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Domain.Notification.Aggregates.Notification>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Domain.Notification.Aggregates.Notification notification, CancellationToken cancellationToken = default)
    {
        await _context.Notifications.AddAsync(notification, cancellationToken);
    }

    public async Task UpdateAsync(Domain.Notification.Aggregates.Notification notification, CancellationToken cancellationToken = default)
    {
        _context.Notifications.Update(notification);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

