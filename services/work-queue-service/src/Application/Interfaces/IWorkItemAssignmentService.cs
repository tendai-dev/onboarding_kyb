using WorkQueueService.Domain.ValueObjects;

namespace WorkQueueService.Application.Interfaces;

/// <summary>
/// Service for suggesting reviewers for manual assignment
/// NOTE: All work item assignments must be done manually by authorized personnel.
/// This service only provides suggestions/recommendations, it does NOT automatically assign work items.
/// </summary>
public interface IWorkItemAssignmentService
{
    /// <summary>
    /// Gets a suggested reviewer for manual assignment based on workload and assignment strategy.
    /// NOTE: This does NOT automatically assign - it only provides a suggestion.
    /// All assignments must be done manually through the AssignWorkItemCommand.
    /// </summary>
    Task<ReviewerAssignment?> GetNextReviewerAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets reviewers suitable for assignment based on risk level.
    /// Used to provide suggestions for manual assignment.
    /// </summary>
    Task<List<ReviewerInfo>> GetAvailableReviewersAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default);
}

/// <summary>
/// Assignment result containing reviewer information
/// </summary>
public record ReviewerAssignment(
    Guid ReviewerId,
    string ReviewerName,
    string AssignmentStrategy
);

/// <summary>
/// Reviewer information for workload calculation
/// </summary>
public record ReviewerInfo(
    Guid Id,
    string Name,
    string Email,
    int ActiveWorkItems,
    int OverdueWorkItems,
    DateTime? LastAssignedAt
);

