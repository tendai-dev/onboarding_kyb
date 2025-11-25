using MediatR;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;

namespace OnboardingApi.Application.WorkQueue.Queries;

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

public class GetWorkItemsQueryHandler : IRequestHandler<GetWorkItemsQuery, PagedResult<WorkItemDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetWorkItemsQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetWorkItemsQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetAllAsync(
            request.Status,
            request.AssignedTo,
            request.RiskLevel,
            request.Country,
            request.IsOverdue,
            request.SearchTerm,
            cancellationToken);

        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => MapToDto(wi))
            .ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    private static WorkItemDto MapToDto(WorkItem wi)
    {
        return new WorkItemDto
        {
            Id = wi.Id,
            WorkItemNumber = wi.WorkItemNumber,
            ApplicationId = wi.ApplicationId,
            ApplicantName = wi.ApplicantName,
            EntityType = wi.EntityType,
            Country = wi.Country,
            Status = wi.Status.ToString(),
            Priority = wi.Priority.ToString(),
            RiskLevel = wi.RiskLevel.ToString(),
            AssignedTo = wi.AssignedTo,
            AssignedToName = wi.AssignedToName,
            AssignedAt = wi.AssignedAt,
            RequiresApproval = wi.RequiresApproval,
            ApprovedBy = wi.ApprovedBy,
            ApprovedByName = wi.ApprovedByName,
            ApprovedAt = wi.ApprovedAt,
            RejectionReason = wi.RejectionReason,
            DueDate = wi.DueDate,
            IsOverdue = wi.IsOverdue,
            NextRefreshDate = wi.NextRefreshDate,
            LastRefreshedAt = wi.LastRefreshedAt,
            RefreshCount = wi.RefreshCount,
            CreatedAt = wi.CreatedAt,
            UpdatedAt = wi.UpdatedAt
        };
    }
}

public class GetWorkItemByIdQueryHandler : IRequestHandler<GetWorkItemByIdQuery, WorkItemDto?>
{
    private readonly IWorkItemRepository _repository;

    public GetWorkItemByIdQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<WorkItemDto?> Handle(GetWorkItemByIdQuery request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return null;

        return new WorkItemDto
        {
            Id = workItem.Id,
            WorkItemNumber = workItem.WorkItemNumber,
            ApplicationId = workItem.ApplicationId,
            ApplicantName = workItem.ApplicantName,
            EntityType = workItem.EntityType,
            Country = workItem.Country,
            Status = workItem.Status.ToString(),
            Priority = workItem.Priority.ToString(),
            RiskLevel = workItem.RiskLevel.ToString(),
            AssignedTo = workItem.AssignedTo,
            AssignedToName = workItem.AssignedToName,
            AssignedAt = workItem.AssignedAt,
            RequiresApproval = workItem.RequiresApproval,
            ApprovedBy = workItem.ApprovedBy,
            ApprovedByName = workItem.ApprovedByName,
            ApprovedAt = workItem.ApprovedAt,
            RejectionReason = workItem.RejectionReason,
            DueDate = workItem.DueDate,
            IsOverdue = workItem.IsOverdue,
            NextRefreshDate = workItem.NextRefreshDate,
            LastRefreshedAt = workItem.LastRefreshedAt,
            RefreshCount = workItem.RefreshCount,
            CreatedAt = workItem.CreatedAt,
            UpdatedAt = workItem.UpdatedAt
        };
    }
}

public class GetWorkItemHistoryQueryHandler : IRequestHandler<GetWorkItemHistoryQuery, List<WorkItemHistoryDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetWorkItemHistoryQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<WorkItemHistoryDto>> Handle(GetWorkItemHistoryQuery request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return new List<WorkItemHistoryDto>();

        return workItem.History
            .OrderByDescending(h => h.PerformedAt)
            .Select(h => new WorkItemHistoryDto
            {
                Id = h.Id,
                Action = h.Action,
                PerformedBy = h.PerformedBy,
                PerformedAt = h.PerformedAt,
                Status = h.Status.ToString()
            })
            .ToList();
    }
}

public class GetWorkItemCommentsQueryHandler : IRequestHandler<GetWorkItemCommentsQuery, List<WorkItemCommentDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetWorkItemCommentsQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<WorkItemCommentDto>> Handle(GetWorkItemCommentsQuery request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return new List<WorkItemCommentDto>();

        return workItem.Comments
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new WorkItemCommentDto
            {
                Id = c.Id,
                Text = c.Text,
                AuthorId = c.AuthorId,
                AuthorName = c.AuthorName,
                CreatedAt = c.CreatedAt
            })
            .ToList();
    }
}

public class GetMyWorkItemsQueryHandler : IRequestHandler<GetMyWorkItemsQuery, PagedResult<WorkItemDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetMyWorkItemsQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetMyWorkItemsQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetByAssignedUserAsync(request.UserId, cancellationToken);
        
        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => new WorkItemDto
            {
                Id = wi.Id,
                WorkItemNumber = wi.WorkItemNumber,
                ApplicationId = wi.ApplicationId,
                ApplicantName = wi.ApplicantName,
                EntityType = wi.EntityType,
                Country = wi.Country,
                Status = wi.Status.ToString(),
                Priority = wi.Priority.ToString(),
                RiskLevel = wi.RiskLevel.ToString(),
                AssignedTo = wi.AssignedTo,
                AssignedToName = wi.AssignedToName,
                AssignedAt = wi.AssignedAt,
                RequiresApproval = wi.RequiresApproval,
                ApprovedBy = wi.ApprovedBy,
                ApprovedByName = wi.ApprovedByName,
                ApprovedAt = wi.ApprovedAt,
                RejectionReason = wi.RejectionReason,
                DueDate = wi.DueDate,
                IsOverdue = wi.IsOverdue,
                NextRefreshDate = wi.NextRefreshDate,
                LastRefreshedAt = wi.LastRefreshedAt,
                RefreshCount = wi.RefreshCount,
                CreatedAt = wi.CreatedAt,
                UpdatedAt = wi.UpdatedAt
            })
            .ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetPendingApprovalsQueryHandler : IRequestHandler<GetPendingApprovalsQuery, PagedResult<WorkItemDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetPendingApprovalsQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetPendingApprovalsQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetPendingApprovalsAsync(request.MinimumRiskLevel, cancellationToken);
        
        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => new WorkItemDto
            {
                Id = wi.Id,
                WorkItemNumber = wi.WorkItemNumber,
                ApplicationId = wi.ApplicationId,
                ApplicantName = wi.ApplicantName,
                EntityType = wi.EntityType,
                Country = wi.Country,
                Status = wi.Status.ToString(),
                Priority = wi.Priority.ToString(),
                RiskLevel = wi.RiskLevel.ToString(),
                AssignedTo = wi.AssignedTo,
                AssignedToName = wi.AssignedToName,
                AssignedAt = wi.AssignedAt,
                RequiresApproval = wi.RequiresApproval,
                ApprovedBy = wi.ApprovedBy,
                ApprovedByName = wi.ApprovedByName,
                ApprovedAt = wi.ApprovedAt,
                RejectionReason = wi.RejectionReason,
                DueDate = wi.DueDate,
                IsOverdue = wi.IsOverdue,
                NextRefreshDate = wi.NextRefreshDate,
                LastRefreshedAt = wi.LastRefreshedAt,
                RefreshCount = wi.RefreshCount,
                CreatedAt = wi.CreatedAt,
                UpdatedAt = wi.UpdatedAt
            })
            .ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetItemsDueForRefreshQueryHandler : IRequestHandler<GetItemsDueForRefreshQuery, PagedResult<WorkItemDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetItemsDueForRefreshQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetItemsDueForRefreshQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetItemsDueForRefreshAsync(request.AsOfDate, cancellationToken);
        
        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => new WorkItemDto
            {
                Id = wi.Id,
                WorkItemNumber = wi.WorkItemNumber,
                ApplicationId = wi.ApplicationId,
                ApplicantName = wi.ApplicantName,
                EntityType = wi.EntityType,
                Country = wi.Country,
                Status = wi.Status.ToString(),
                Priority = wi.Priority.ToString(),
                RiskLevel = wi.RiskLevel.ToString(),
                AssignedTo = wi.AssignedTo,
                AssignedToName = wi.AssignedToName,
                AssignedAt = wi.AssignedAt,
                RequiresApproval = wi.RequiresApproval,
                ApprovedBy = wi.ApprovedBy,
                ApprovedByName = wi.ApprovedByName,
                ApprovedAt = wi.ApprovedAt,
                RejectionReason = wi.RejectionReason,
                DueDate = wi.DueDate,
                IsOverdue = wi.IsOverdue,
                NextRefreshDate = wi.NextRefreshDate,
                LastRefreshedAt = wi.LastRefreshedAt,
                RefreshCount = wi.RefreshCount,
                CreatedAt = wi.CreatedAt,
                UpdatedAt = wi.UpdatedAt
            })
            .ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

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

