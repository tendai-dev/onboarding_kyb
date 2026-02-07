using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.Enums;
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
    Task<int> UpdateAssignmentDirectlyAsync(Guid workItemId, string assignedToUserId, string assignedToUserName, string assignedByUserId, CancellationToken cancellationToken = default);
    Task<int> UpdateStatusDirectlyAsync(Guid workItemId, WorkItemStatus newStatus, string updatedBy, CancellationToken cancellationToken = default);
    Task<int> CompleteDirectlyAsync(Guid workItemId, string completedBy, CancellationToken cancellationToken = default);
    Task<int> ApproveDirectlyAsync(Guid workItemId, Guid approverId, string approverName, CancellationToken cancellationToken = default);
    Task<int> UnassignDirectlyAsync(Guid workItemId, string unassignedBy, CancellationToken cancellationToken = default);
    Task AddHistoryEntryAsync(Guid workItemId, string action, string performedBy, string status, CancellationToken cancellationToken = default);
    Task<int> UpdatePriorityAsync(Guid workItemId, WorkItemPriority priority, string updatedBy, CancellationToken cancellationToken = default);
    
    // Step review methods
    Task<WorkItemStepReview?> GetStepReviewAsync(Guid workItemId, string stepId, CancellationToken cancellationToken = default);
    Task<List<WorkItemStepReview>> GetStepReviewsAsync(Guid workItemId, CancellationToken cancellationToken = default);
    Task AddOrUpdateStepReviewAsync(WorkItemStepReview review, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Atomically upsert a step review using database-level ON CONFLICT to prevent race conditions.
    /// This is the preferred method for concurrent updates.
    /// </summary>
    Task<Guid> UpsertStepReviewAsync(
        Guid workItemId,
        string stepId,
        ReviewField field,
        bool value,
        string? updatedByUserId,
        string? notes,
        CancellationToken cancellationToken = default);
    
    // Comment methods - direct database operations to avoid EF Core owned collection issues
    Task<Guid> AddCommentDirectlyAsync(Guid workItemId, string text, string authorId, string authorName, CancellationToken cancellationToken = default);
    
    // Mark for refresh - direct database operation to avoid concurrency issues
    Task<int> MarkForRefreshDirectlyAsync(Guid workItemId, string markedBy, CancellationToken cancellationToken = default);
    
    // Decline - direct database operation to avoid concurrency issues
    Task<(int rowsAffected, Guid? applicationId)> DeclineDirectlyAsync(Guid workItemId, string declinedBy, string reason, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Delete all work items (admin operation)
    /// </summary>
    Task<int> DeleteAllAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get total count of work items
    /// </summary>
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
}

