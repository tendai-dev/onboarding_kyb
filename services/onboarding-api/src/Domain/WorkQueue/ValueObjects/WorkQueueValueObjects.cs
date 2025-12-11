namespace OnboardingApi.Domain.WorkQueue.ValueObjects;

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

