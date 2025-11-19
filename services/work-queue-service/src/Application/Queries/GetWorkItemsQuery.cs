using MediatR;

namespace WorkQueueService.Application.Queries;

public record GetWorkItemsQuery(
    WorkItemStatus? Status = null,
    Guid? AssignedTo = null,
    RiskLevel? RiskLevel = null,
    string? Country = null,
    bool? IsOverdue = null,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<WorkItemDto>>;

public record GetWorkItemByIdQuery(
    Guid WorkItemId
) : IRequest<WorkItemDto?>;

public record GetWorkItemHistoryQuery(
    Guid WorkItemId
) : IRequest<List<WorkItemHistoryDto>>;

public record GetWorkItemCommentsQuery(
    Guid WorkItemId
) : IRequest<List<WorkItemCommentDto>>;

public record GetMyWorkItemsQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<WorkItemDto>>;

public record GetPendingApprovalsQuery(
    RiskLevel? MinimumRiskLevel = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<WorkItemDto>>;

public record GetItemsDueForRefreshQuery(
    DateTime? AsOfDate = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<WorkItemDto>>;

// DTOs
public record WorkItemDto
{
    public Guid Id { get; init; }
    public string WorkItemNumber { get; init; } = string.Empty;
    public Guid ApplicationId { get; init; }
    public string ApplicantName { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public string RiskLevel { get; init; } = string.Empty;
    public Guid? AssignedTo { get; init; }
    public string? AssignedToName { get; init; }
    public DateTime? AssignedAt { get; init; }
    public bool RequiresApproval { get; init; }
    public Guid? ApprovedBy { get; init; }
    public string? ApprovedByName { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public string? RejectionReason { get; init; }
    public DateTime DueDate { get; init; }
    public bool IsOverdue { get; init; }
    public DateTime? NextRefreshDate { get; init; }
    public DateTime? LastRefreshedAt { get; init; }
    public int RefreshCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record WorkItemHistoryDto
{
    public Guid Id { get; init; }
    public string Action { get; init; } = string.Empty;
    public string PerformedBy { get; init; } = string.Empty;
    public DateTime PerformedAt { get; init; }
    public string Status { get; init; } = string.Empty;
}

public record WorkItemCommentDto
{
    public Guid Id { get; init; }
    public string Text { get; init; } = string.Empty;
    public string AuthorId { get; init; } = string.Empty;
    public string AuthorName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public record PagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}

// Enums
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

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

