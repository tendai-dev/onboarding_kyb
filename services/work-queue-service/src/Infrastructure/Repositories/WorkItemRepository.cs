using Microsoft.EntityFrameworkCore;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Domain.Aggregates;
using WorkQueueService.Infrastructure.Persistence;

namespace WorkQueueService.Infrastructure.Repositories;

public class WorkItemRepository : IWorkItemRepository
{
    private readonly WorkQueueDbContext _context;

    public WorkItemRepository(WorkQueueDbContext context)
    {
        _context = context;
    }

    public async Task<WorkItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<List<WorkItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WorkItem>> GetByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .Where(w => w.Status == status)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WorkItem>> GetByAssigneeAsync(Guid assigneeId, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .Where(w => w.AssigneeId == assigneeId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        await _context.WorkItems.AddAsync(workItem, cancellationToken);
    }

    public async Task UpdateAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        _context.WorkItems.Update(workItem);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

