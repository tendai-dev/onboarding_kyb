using WorkQueueService.Domain.Events;
using WorkQueueService.Domain.ValueObjects;

namespace WorkQueueService.Domain.Aggregates;

/// <summary>
/// Work Item Aggregate Root
/// Represents an onboarding application in the admin work queue with assignment and approval workflow
/// </summary>
public class WorkItem
{
    private readonly List<IDomainEvent> _domainEvents = new();
    private readonly List<WorkItemComment> _comments = new();
    private readonly List<WorkItemHistoryEntry> _history = new();
    
    public Guid Id { get; private set; }
    public string WorkItemNumber { get; private set; } = string.Empty;
    
    // Application details
    public Guid ApplicationId { get; private set; }
    public string ApplicantName { get; private set; } = string.Empty;
    public string EntityType { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    
    // Status and workflow
    public WorkItemStatus Status { get; private set; }
    public WorkItemPriority Priority { get; private set; }
    public ValueObjects.RiskLevel RiskLevel { get; private set; }
    
    // Assignment
    public Guid? AssignedTo { get; private set; }
    public string? AssignedToName { get; private set; }
    public DateTime? AssignedAt { get; private set; }
    
    // Approval workflow
    public bool RequiresApproval { get; private set; }
    public Guid? ApprovedBy { get; private set; }
    public string? ApprovedByName { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public string? ApprovalNotes { get; private set; }
    
    // Rejection
    public string? RejectionReason { get; private set; }
    public DateTime? RejectedAt { get; private set; }
    
    // Refresh tracking
    public DateTime? NextRefreshDate { get; private set; }
    public DateTime? LastRefreshedAt { get; private set; }
    public int RefreshCount { get; private set; }
    
    // SLA tracking
    public DateTime DueDate { get; private set; }
    public bool IsOverdue => DateTime.UtcNow > DueDate && !IsCompleted;
    public bool IsCompleted => Status == WorkItemStatus.Completed || 
                              Status == WorkItemStatus.Declined || 
                              Status == WorkItemStatus.Cancelled;
    
    // Metadata
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTime? UpdatedAt { get; private set; }
    public string? UpdatedBy { get; private set; }
    
    // Collections
    public IReadOnlyCollection<WorkItemComment> Comments => _comments.AsReadOnly();
    public IReadOnlyCollection<WorkItemHistoryEntry> History => _history.AsReadOnly();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    private WorkItem() { }
    
    public static WorkItem Create(
        Guid applicationId,
        string applicantName,
        string entityType,
        string country,
        ValueObjects.RiskLevel riskLevel,
        string createdBy,
        int slaDays = 5)
    {
        var workItem = new WorkItem
        {
            Id = Guid.NewGuid(),
            WorkItemNumber = GenerateWorkItemNumber(),
            ApplicationId = applicationId,
            ApplicantName = applicantName,
            EntityType = entityType,
            Country = country,
            Status = WorkItemStatus.New,
            Priority = DeterminePriority(riskLevel),
            RiskLevel = riskLevel,
            RequiresApproval = riskLevel is ValueObjects.RiskLevel.High or ValueObjects.RiskLevel.Critical,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            DueDate = DateTime.UtcNow.AddDays(slaDays),
            RefreshCount = 0
        };
        
        workItem.AddHistoryEntry("Work item created", createdBy);
        
        workItem.AddDomainEvent(new WorkItemCreatedEvent(
            workItem.Id,
            workItem.ApplicationId,
            workItem.RiskLevel,
            workItem.RequiresApproval,
            DateTime.UtcNow
        ));
        
        return workItem;
    }
    
    public void AssignTo(Guid userId, string userName, string assignedBy)
    {
        if (IsCompleted)
            throw new InvalidOperationException("Cannot assign completed work item");
        
        var previousAssignee = AssignedToName;
        
        AssignedTo = userId;
        AssignedToName = userName;
        AssignedAt = DateTime.UtcNow;
        Status = WorkItemStatus.Assigned;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = assignedBy;
        
        AddHistoryEntry($"Assigned to {userName}" + 
            (previousAssignee != null ? $" (previously: {previousAssignee})" : ""), 
            assignedBy);
        
        AddDomainEvent(new WorkItemAssignedEvent(
            Id,
            ApplicationId,
            userId,
            userName,
            DateTime.UtcNow
        ));
    }
    
    public void Unassign(string unassignedBy)
    {
        if (AssignedTo == null)
            throw new InvalidOperationException("Work item is not assigned");
        
        var previousAssignee = AssignedToName;
        
        AssignedTo = null;
        AssignedToName = null;
        AssignedAt = null;
        Status = WorkItemStatus.New;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = unassignedBy;
        
        AddHistoryEntry($"Unassigned from {previousAssignee}", unassignedBy);
        
        AddDomainEvent(new WorkItemUnassignedEvent(
            Id,
            ApplicationId,
            DateTime.UtcNow
        ));
    }
    
    public void StartReview(string reviewedBy)
    {
        if (AssignedTo == null)
            throw new InvalidOperationException("Work item must be assigned before review");
        
        if (Status != WorkItemStatus.Assigned)
            throw new InvalidOperationException($"Cannot start review from status: {Status}");
        
        Status = WorkItemStatus.InProgress;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = reviewedBy;
        
        AddHistoryEntry("Review started", reviewedBy);
        
        AddDomainEvent(new WorkItemReviewStartedEvent(
            Id,
            ApplicationId,
            DateTime.UtcNow
        ));
    }
    
    public void SubmitForApproval(string submittedBy, string? notes = null)
    {
        if (!RequiresApproval)
            throw new InvalidOperationException("This work item does not require approval");
        
        if (Status != WorkItemStatus.InProgress)
            throw new InvalidOperationException($"Cannot submit for approval from status: {Status}");
        
        Status = WorkItemStatus.PendingApproval;
        ApprovalNotes = notes;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = submittedBy;
        
        AddHistoryEntry("Submitted for approval" + (notes != null ? $": {notes}" : ""), submittedBy);
        
        AddDomainEvent(new WorkItemSubmittedForApprovalEvent(
            Id,
            ApplicationId,
            RiskLevel,
            DateTime.UtcNow
        ));
    }
    
    public void Approve(Guid approverId, string approverName, string approverRole, string? notes = null)
    {
        if (Status != WorkItemStatus.PendingApproval)
            throw new InvalidOperationException($"Cannot approve from status: {Status}");
        
        // Check if approver has sufficient role for risk level
        if (RiskLevel is ValueObjects.RiskLevel.High or ValueObjects.RiskLevel.Critical)
        {
            if (!approverRole.Contains("ComplianceManager", StringComparison.OrdinalIgnoreCase) &&
                !approverRole.Contains("Admin", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("High/Critical risk items require Compliance Manager approval");
            }
        }
        
        Status = WorkItemStatus.Approved;
        ApprovedBy = approverId;
        ApprovedByName = approverName;
        ApprovedAt = DateTime.UtcNow;
        ApprovalNotes = notes;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = approverName;
        
        AddHistoryEntry($"Approved by {approverName}" + (notes != null ? $": {notes}" : ""), approverName);
        
        AddDomainEvent(new WorkItemApprovedEvent(
            Id,
            ApplicationId,
            approverId,
            approverName,
            DateTime.UtcNow
        ));
    }
    
    public void Complete(string completedBy, string? notes = null)
    {
        if (RequiresApproval && Status != WorkItemStatus.Approved)
            throw new InvalidOperationException("Work item must be approved before completion");
        
        if (IsCompleted)
            throw new InvalidOperationException("Work item is already completed");
        
        Status = WorkItemStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = completedBy;
        
        AddHistoryEntry("Completed" + (notes != null ? $": {notes}" : ""), completedBy);
        
        AddDomainEvent(new WorkItemCompletedEvent(
            Id,
            ApplicationId,
            DateTime.UtcNow
        ));
    }
    
    public void Decline(string declinedBy, string reason)
    {
        if (IsCompleted)
            throw new InvalidOperationException("Work item is already completed");
        
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Decline reason is required");
        
        Status = WorkItemStatus.Declined;
        RejectionReason = reason;
        RejectedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = declinedBy;
        
        AddHistoryEntry($"Declined: {reason}", declinedBy);
        
        AddDomainEvent(new WorkItemDeclinedEvent(
            Id,
            ApplicationId,
            reason,
            DateTime.UtcNow
        ));
    }
    
    public void Cancel(string cancelledBy, string reason)
    {
        if (IsCompleted)
            throw new InvalidOperationException("Work item is already completed");
        
        Status = WorkItemStatus.Cancelled;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = cancelledBy;
        
        AddHistoryEntry($"Cancelled: {reason}", cancelledBy);
    }
    
    public void ScheduleRefresh(DateTime nextRefreshDate, string scheduledBy)
    {
        if (Status != WorkItemStatus.Completed)
            throw new InvalidOperationException("Only completed work items can be scheduled for refresh");
        
        NextRefreshDate = nextRefreshDate;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = scheduledBy;
        
        AddHistoryEntry($"Scheduled for refresh on {nextRefreshDate:yyyy-MM-dd}", scheduledBy);
        
        AddDomainEvent(new WorkItemRefreshScheduledEvent(
            Id,
            ApplicationId,
            nextRefreshDate,
            DateTime.UtcNow
        ));
    }
    
    public void MarkForRefresh(string markedBy)
    {
        Status = WorkItemStatus.DueForRefresh;
        LastRefreshedAt = DateTime.UtcNow;
        RefreshCount++;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = markedBy;
        
        AddHistoryEntry($"Marked for refresh (Count: {RefreshCount})", markedBy);
        
        AddDomainEvent(new WorkItemMarkedForRefreshEvent(
            Id,
            ApplicationId,
            RefreshCount,
            DateTime.UtcNow
        ));
    }
    
    public void AddComment(string text, string authorId, string authorName)
    {
        var comment = new WorkItemComment
        {
            Id = Guid.NewGuid(),
            WorkItemId = Id,
            Text = text,
            AuthorId = authorId,
            AuthorName = authorName,
            CreatedAt = DateTime.UtcNow
        };
        
        _comments.Add(comment);
        UpdatedAt = DateTime.UtcNow;
    }
    
    public void UpdatePriority(WorkItemPriority newPriority, string updatedBy)
    {
        if (Priority == newPriority) return;
        
        var oldPriority = Priority;
        Priority = newPriority;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        
        AddHistoryEntry($"Priority changed from {oldPriority} to {newPriority}", updatedBy);
    }
    
    public void ClearDomainEvents() => _domainEvents.Clear();
    
    private void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    
    private void AddHistoryEntry(string action, string performedBy)
    {
        _history.Add(new WorkItemHistoryEntry
        {
            Id = Guid.NewGuid(),
            WorkItemId = Id,
            Action = action,
            PerformedBy = performedBy,
            PerformedAt = DateTime.UtcNow,
            Status = Status
        });
    }
    
    private static string GenerateWorkItemNumber()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Random.Shared.Next(1000, 9999);
        return $"WI-{datePart}-{randomPart}";
    }
    
    private static WorkItemPriority DeterminePriority(ValueObjects.RiskLevel riskLevel)
    {
        // Priority is determined by manually assessed risk level
        // Unknown risk level defaults to Medium priority until manually assessed
        return riskLevel switch
        {
            ValueObjects.RiskLevel.Critical => WorkItemPriority.Critical,
            ValueObjects.RiskLevel.High => WorkItemPriority.High,
            ValueObjects.RiskLevel.Medium => WorkItemPriority.Medium,
            ValueObjects.RiskLevel.Low => WorkItemPriority.Low,
            ValueObjects.RiskLevel.Unknown => WorkItemPriority.Medium, // Default until manually assessed
            _ => WorkItemPriority.Medium
        };
    }
}

public enum WorkItemStatus
{
    New = 1,
    Assigned = 2,
    InProgress = 3,
    PendingApproval = 4,
    Approved = 5,
    Completed = 6,
    Declined = 7,
    Cancelled = 8,
    DueForRefresh = 9
}

public enum WorkItemPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum RiskLevel
{
    Unknown = 0,  // Default until manually assessed by reviewer
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public class WorkItemComment
{
    public Guid Id { get; set; }
    public Guid WorkItemId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class WorkItemHistoryEntry
{
    public Guid Id { get; set; }
    public Guid WorkItemId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime PerformedAt { get; set; }
    public WorkItemStatus Status { get; set; }
}

