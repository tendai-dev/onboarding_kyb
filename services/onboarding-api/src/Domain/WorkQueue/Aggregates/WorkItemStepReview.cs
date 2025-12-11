namespace OnboardingApi.Domain.WorkQueue.Aggregates;

/// <summary>
/// Step Review Status for Work Items
/// Tracks reviewer actions (completed, verified, approved) for each wizard step
/// </summary>
public class WorkItemStepReview
{
    public Guid Id { get; set; }
    public Guid WorkItemId { get; set; }
    public string StepId { get; set; } = string.Empty; // Wizard step ID
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public bool Verified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public bool Approved { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public string? Notes { get; set; } // Optional notes for the step
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

