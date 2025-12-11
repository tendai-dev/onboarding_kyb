using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;

namespace OnboardingApi.Application.WorkQueue.Interfaces;

public interface IWorkItemRepository
{
    Task<WorkItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WorkItem?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);
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
    Task DeleteAsync(WorkItem workItem, CancellationToken cancellationToken = default);
    Task DeleteByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task DetachIfTrackedAsync(Guid workItemId, CancellationToken cancellationToken = default);
    Task<int> UpdateAssignmentDirectlyAsync(Guid workItemId, Guid assignedToUserId, string assignedToUserName, string assignedByUserId, CancellationToken cancellationToken = default);
    Task<int> UpdateStatusDirectlyAsync(Guid workItemId, WorkItemStatus newStatus, string updatedBy, CancellationToken cancellationToken = default);
    Task AddHistoryEntryAsync(Guid workItemId, string action, string performedBy, string status, CancellationToken cancellationToken = default);
    
    // Step review methods
    Task<WorkItemStepReview?> GetStepReviewAsync(Guid workItemId, string stepId, CancellationToken cancellationToken = default);
    Task<List<WorkItemStepReview>> GetStepReviewsAsync(Guid workItemId, CancellationToken cancellationToken = default);
    Task AddOrUpdateStepReviewAsync(WorkItemStepReview review, CancellationToken cancellationToken = default);
}

