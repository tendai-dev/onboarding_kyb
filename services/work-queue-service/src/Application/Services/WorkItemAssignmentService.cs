using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Domain.ValueObjects;
using WorkQueueService.Domain.Utilities;
using RiskLevel = WorkQueueService.Domain.ValueObjects.RiskLevel;

namespace WorkQueueService.Application.Services;

/// <summary>
/// Service for suggesting reviewers for manual assignment
/// NOTE: All work item assignments must be done manually by authorized personnel.
/// This service only provides suggestions/recommendations, it does NOT automatically assign work items.
/// </summary>
public class WorkItemAssignmentService : IWorkItemAssignmentService
{
    private readonly IWorkItemRepository _workItemRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WorkItemAssignmentService> _logger;

    public WorkItemAssignmentService(
        IWorkItemRepository workItemRepository,
        IConfiguration configuration,
        ILogger<WorkItemAssignmentService> logger)
    {
        _workItemRepository = workItemRepository;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Get a suggested reviewer for manual assignment
    /// NOTE: This does NOT automatically assign - it only provides a suggestion.
    /// All assignments must be done manually through the AssignWorkItemCommand.
    /// </summary>
    public async Task<ReviewerAssignment?> GetNextReviewerAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default)
    {
        var reviewers = await GetAvailableReviewersAsync(riskLevel, cancellationToken);
        
        if (reviewers.Count == 0)
        {
            _logger.LogWarning("No reviewers available for risk level {RiskLevel}", riskLevel);
            return null;
        }

        // Suggest reviewer based on workload/round-robin
        // This is only a suggestion - actual assignment must be done manually
        return riskLevel switch
        {
            RiskLevel.Low => AssignByWorkload(reviewers),
            RiskLevel.Medium => AssignRoundRobin(reviewers),
            RiskLevel.High => AssignByWorkload(reviewers), // Suggest but require manual assignment
            RiskLevel.Critical => AssignByWorkload(reviewers), // Suggest but require manual assignment
            RiskLevel.Unknown => AssignRoundRobin(reviewers), // Suggest for unassessed items
            _ => AssignRoundRobin(reviewers)
        };
    }

    public async Task<List<ReviewerInfo>> GetAvailableReviewersAsync(RiskLevel riskLevel, CancellationToken cancellationToken = default)
    {
        // Get reviewers from configuration
        // For now, we'll use a simple configuration approach
        // In production, this would fetch from Keycloak or a user service
        
        var reviewerEmails = _configuration.GetSection("WorkQueue:Reviewers").Get<List<string>>() ?? new List<string>();
        var complianceManagerEmails = _configuration.GetSection("WorkQueue:ComplianceManagers").Get<List<string>>() ?? new List<string>();

        var reviewers = new List<ReviewerInfo>();

        // High/Critical risk should go to Compliance Managers
        if (riskLevel is RiskLevel.High or RiskLevel.Critical)
        {
            foreach (var email in complianceManagerEmails)
            {
                var reviewerId = PartnerIdGenerator.GenerateFromEmail(email);
                var workload = await CalculateWorkloadAsync(reviewerId, cancellationToken);
                
                reviewers.Add(new ReviewerInfo(
                    Id: reviewerId,
                    Name: email.Split('@')[0], // Simple name from email
                    Email: email,
                    ActiveWorkItems: workload.ActiveCount,
                    OverdueWorkItems: workload.OverdueCount,
                    LastAssignedAt: workload.LastAssignedAt
                ));
            }
        }
        else
        {
            // Low/Medium risk can go to regular reviewers
            foreach (var email in reviewerEmails)
            {
                var reviewerId = PartnerIdGenerator.GenerateFromEmail(email);
                var workload = await CalculateWorkloadAsync(reviewerId, cancellationToken);
                
                reviewers.Add(new ReviewerInfo(
                    Id: reviewerId,
                    Name: email.Split('@')[0],
                    Email: email,
                    ActiveWorkItems: workload.ActiveCount,
                    OverdueWorkItems: workload.OverdueCount,
                    LastAssignedAt: workload.LastAssignedAt
                ));
            }
        }

        return reviewers;
    }

    private ReviewerAssignment AssignByWorkload(List<ReviewerInfo> reviewers)
    {
        // Assign to reviewer with least workload (active + overdue items)
        var bestReviewer = reviewers
            .OrderBy(r => r.ActiveWorkItems + (r.OverdueWorkItems * 2)) // Overdue items count double
            .ThenBy(r => r.LastAssignedAt ?? DateTime.MinValue)
            .First();

        return new ReviewerAssignment(
            ReviewerId: bestReviewer.Id,
            ReviewerName: bestReviewer.Name,
            AssignmentStrategy: "Workload-Based"
        );
    }

    private ReviewerAssignment AssignRoundRobin(List<ReviewerInfo> reviewers)
    {
        // Assign to reviewer with oldest last assignment (or never assigned)
        var bestReviewer = reviewers
            .OrderBy(r => r.LastAssignedAt ?? DateTime.MinValue)
            .ThenBy(r => r.ActiveWorkItems)
            .First();

        return new ReviewerAssignment(
            ReviewerId: bestReviewer.Id,
            ReviewerName: bestReviewer.Name,
            AssignmentStrategy: "Round-Robin"
        );
    }

    private async Task<WorkloadInfo> CalculateWorkloadAsync(Guid reviewerId, CancellationToken cancellationToken)
    {
        // Get all work items assigned to this reviewer
        var allItems = await _workItemRepository.GetAllAsync(cancellationToken);
        
        var reviewerItems = allItems.Where(w => w.AssignedTo == reviewerId).ToList();
        
        var activeCount = reviewerItems.Count(w => 
            w.Status != Domain.Aggregates.WorkItemStatus.Completed && 
            w.Status != Domain.Aggregates.WorkItemStatus.Declined && 
            w.Status != Domain.Aggregates.WorkItemStatus.Cancelled);

        var overdueCount = reviewerItems.Count(w => w.IsOverdue);

        var lastAssignedAt = reviewerItems
            .Where(w => w.AssignedAt.HasValue)
            .OrderByDescending(w => w.AssignedAt)
            .FirstOrDefault()?.AssignedAt;

        return new WorkloadInfo(activeCount, overdueCount, lastAssignedAt);
    }

    private record WorkloadInfo(
        int ActiveCount,
        int OverdueCount,
        DateTime? LastAssignedAt
    );
}

