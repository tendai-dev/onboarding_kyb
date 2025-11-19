using NotificationService.Application.Interfaces;
using NotificationService.Domain.Aggregates;
using NotificationService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace NotificationService.Infrastructure.Repositories;

public class NotificationTemplateRepository : INotificationTemplateRepository
{
    private readonly NotificationDbContext _context;

    public NotificationTemplateRepository(NotificationDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationTemplate?> GetByIdAsync(NotificationTemplateId id, CancellationToken cancellationToken = default)
    {
        return await _context.NotificationTemplates
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<NotificationTemplate>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.NotificationTemplates
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<NotificationTemplate>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.NotificationTemplates
            .Where(t => t.IsActive)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(NotificationTemplate template, CancellationToken cancellationToken = default)
    {
        await _context.NotificationTemplates.AddAsync(template, cancellationToken);
    }

    public async Task UpdateAsync(NotificationTemplate template, CancellationToken cancellationToken = default)
    {
        _context.NotificationTemplates.Update(template);
    }

    public async Task DeleteAsync(NotificationTemplate template, CancellationToken cancellationToken = default)
    {
        _context.NotificationTemplates.Remove(template);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

