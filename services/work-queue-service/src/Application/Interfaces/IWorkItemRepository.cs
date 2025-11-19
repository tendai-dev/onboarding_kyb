using WorkQueueService.Domain.Aggregates;

namespace WorkQueueService.Application.Interfaces;

public interface IWorkItemRepository
{
    Task<WorkItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetByAssigneeAsync(Guid assigneeId, CancellationToken cancellationToken = default);
    Task AddAsync(WorkItem workItem, CancellationToken cancellationToken = default);
    Task UpdateAsync(WorkItem workItem, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task ClearTrackingAsync(Guid id, CancellationToken cancellationToken = default);
}

