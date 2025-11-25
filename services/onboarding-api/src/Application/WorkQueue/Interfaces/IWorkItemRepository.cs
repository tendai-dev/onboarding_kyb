using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;

namespace OnboardingApi.Application.WorkQueue.Interfaces;

public interface IWorkItemRepository
{
    Task<WorkItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WorkItem?> GetByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetAllAsync(
        WorkItemStatus? status = null,
        Guid? assignedTo = null,
        RiskLevel? riskLevel = null,
        string? country = null,
        bool? isOverdue = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetByAssignedUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetPendingApprovalsAsync(RiskLevel? minimumRiskLevel = null, CancellationToken cancellationToken = default);
    Task<List<WorkItem>> GetItemsDueForRefreshAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default);
    Task AddAsync(WorkItem workItem, CancellationToken cancellationToken = default);
    Task UpdateAsync(WorkItem workItem, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

