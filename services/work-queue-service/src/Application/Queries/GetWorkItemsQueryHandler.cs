using MediatR;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Domain.Aggregates;
using WorkQueueService.Domain.ValueObjects;

namespace WorkQueueService.Application.Queries;

public class GetWorkItemsQueryHandler : IRequestHandler<GetWorkItemsQuery, PagedResult<WorkItemDto>>
{
    private readonly IWorkItemRepository _repository;

    public GetWorkItemsQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetWorkItemsQuery request, CancellationToken cancellationToken)
    {
        var allItems = await _repository.GetAllAsync(cancellationToken);
        
        // Apply filters
        var filtered = allItems.AsQueryable();
        
        if (request.Status.HasValue)
        {
            // Map Application layer enum to Domain enum (Domain.Aggregates.WorkItemStatus)
            var status = request.Status.Value switch
            {
                WorkItemStatus.New => Domain.Aggregates.WorkItemStatus.New,
                WorkItemStatus.Assigned => Domain.Aggregates.WorkItemStatus.Assigned,
                WorkItemStatus.InProgress => Domain.Aggregates.WorkItemStatus.InProgress,
                WorkItemStatus.PendingApproval => Domain.Aggregates.WorkItemStatus.PendingApproval,
                WorkItemStatus.Approved => Domain.Aggregates.WorkItemStatus.Approved,
                WorkItemStatus.Completed => Domain.Aggregates.WorkItemStatus.Completed,
                WorkItemStatus.Declined => Domain.Aggregates.WorkItemStatus.Declined,
                WorkItemStatus.Cancelled => Domain.Aggregates.WorkItemStatus.Cancelled,
                WorkItemStatus.DueForRefresh => Domain.Aggregates.WorkItemStatus.DueForRefresh,
                _ => Domain.Aggregates.WorkItemStatus.New
            };
            filtered = filtered.Where(w => w.Status == status);
        }
        
        if (request.AssignedTo.HasValue)
        {
            filtered = filtered.Where(w => w.AssignedTo == request.AssignedTo.Value);
        }
        
        if (request.RiskLevel.HasValue)
        {
            var riskLevel = request.RiskLevel.Value switch
            {
                RiskLevel.Low => Domain.ValueObjects.RiskLevel.Low,
                RiskLevel.Medium => Domain.ValueObjects.RiskLevel.Medium,
                RiskLevel.High => Domain.ValueObjects.RiskLevel.High,
                RiskLevel.Critical => Domain.ValueObjects.RiskLevel.Critical,
                _ => Domain.ValueObjects.RiskLevel.Medium
            };
            filtered = filtered.Where(w => w.RiskLevel == riskLevel); // w.RiskLevel is Domain.ValueObjects.RiskLevel
        }
        
        if (!string.IsNullOrEmpty(request.Country))
        {
            filtered = filtered.Where(w => w.Country == request.Country);
        }
        
        if (request.IsOverdue.HasValue && request.IsOverdue.Value)
        {
            filtered = filtered.Where(w => w.DueDate < DateTime.UtcNow && w.Status != Domain.Aggregates.WorkItemStatus.Approved && w.Status != Domain.Aggregates.WorkItemStatus.Completed);
        }

        // Apply search term filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchLower = request.SearchTerm.ToLower();
            filtered = filtered.Where(w =>
                w.WorkItemNumber.ToLower().Contains(searchLower) ||
                w.ApplicantName.ToLower().Contains(searchLower) ||
                w.EntityType.ToLower().Contains(searchLower) ||
                w.Country.ToLower().Contains(searchLower) ||
                w.ApplicationId.ToString().ToLower().Contains(searchLower) ||
                (w.AssignedToName != null && w.AssignedToName.ToLower().Contains(searchLower))
            );
        }

        var totalCount = filtered.Count();
        
        // Apply pagination
        var pagedItems = filtered
            .OrderByDescending(w => w.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(MapToDto).ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    private WorkItemDto MapToDto(WorkItem item)
    {
        return new WorkItemDto
        {
            Id = item.Id,
            WorkItemNumber = item.WorkItemNumber,
            ApplicationId = item.ApplicationId,
            ApplicantName = item.ApplicantName,
            EntityType = item.EntityType,
            Country = item.Country,
            Status = WorkItemStatusMapper.MapStatusToApiString(item.Status), // item.Status is Domain.Aggregates.WorkItemStatus
            Priority = item.Priority.ToString(),
            RiskLevel = item.RiskLevel.ToString(),
            AssignedTo = item.AssignedTo,
            AssignedToName = item.AssignedToName,
            AssignedAt = item.AssignedAt,
            RequiresApproval = item.RequiresApproval,
            ApprovedBy = item.ApprovedBy,
            ApprovedByName = item.ApprovedByName,
            ApprovedAt = item.ApprovedAt,
            RejectionReason = item.RejectionReason,
            DueDate = item.DueDate,
            IsOverdue = item.DueDate < DateTime.UtcNow && item.Status != Domain.Aggregates.WorkItemStatus.Approved && item.Status != Domain.Aggregates.WorkItemStatus.Completed,
            NextRefreshDate = item.NextRefreshDate,
            LastRefreshedAt = item.LastRefreshedAt,
            RefreshCount = item.RefreshCount,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
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
        var allItems = await _repository.GetAllAsync(cancellationToken);
        
        // Filter for pending approvals
        var filtered = allItems
            .Where(w => w.Status == Domain.Aggregates.WorkItemStatus.PendingApproval && w.RequiresApproval)
            .AsQueryable();
        
        // Filter by minimum risk level if specified
        if (request.MinimumRiskLevel.HasValue)
        {
            var minRiskLevel = request.MinimumRiskLevel.Value switch
            {
                RiskLevel.Low => Domain.ValueObjects.RiskLevel.Low,
                RiskLevel.Medium => Domain.ValueObjects.RiskLevel.Medium,
                RiskLevel.High => Domain.ValueObjects.RiskLevel.High,
                RiskLevel.Critical => Domain.ValueObjects.RiskLevel.Critical,
                _ => Domain.ValueObjects.RiskLevel.Low
            };
            
            filtered = filtered.Where(w => 
                (minRiskLevel == Domain.ValueObjects.RiskLevel.Low && w.RiskLevel >= Domain.ValueObjects.RiskLevel.Low) ||
                (minRiskLevel == Domain.ValueObjects.RiskLevel.Medium && (w.RiskLevel == Domain.ValueObjects.RiskLevel.Medium || w.RiskLevel == Domain.ValueObjects.RiskLevel.High || w.RiskLevel == Domain.ValueObjects.RiskLevel.Critical)) ||
                (minRiskLevel == Domain.ValueObjects.RiskLevel.High && (w.RiskLevel == Domain.ValueObjects.RiskLevel.High || w.RiskLevel == Domain.ValueObjects.RiskLevel.Critical)) ||
                (minRiskLevel == Domain.ValueObjects.RiskLevel.Critical && w.RiskLevel == Domain.ValueObjects.RiskLevel.Critical)
            );
        }

        var totalCount = filtered.Count();
        
        // Apply pagination
        var pagedItems = filtered
            .OrderByDescending(w => w.Priority)
            .ThenByDescending(w => w.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(MapToDto).ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    private WorkItemDto MapToDto(WorkItem item)
    {
        return new WorkItemDto
        {
            Id = item.Id,
            WorkItemNumber = item.WorkItemNumber,
            ApplicationId = item.ApplicationId,
            ApplicantName = item.ApplicantName,
            EntityType = item.EntityType,
            Country = item.Country,
            Status = WorkItemStatusMapper.MapStatusToApiString(item.Status), // item.Status is Domain.Aggregates.WorkItemStatus
            Priority = item.Priority.ToString(),
            RiskLevel = item.RiskLevel.ToString(),
            AssignedTo = item.AssignedTo,
            AssignedToName = item.AssignedToName,
            AssignedAt = item.AssignedAt,
            RequiresApproval = item.RequiresApproval,
            ApprovedBy = item.ApprovedBy,
            ApprovedByName = item.ApprovedByName,
            ApprovedAt = item.ApprovedAt,
            RejectionReason = item.RejectionReason,
            DueDate = item.DueDate,
            IsOverdue = item.DueDate < DateTime.UtcNow && item.Status != Domain.Aggregates.WorkItemStatus.Approved && item.Status != Domain.Aggregates.WorkItemStatus.Completed,
            NextRefreshDate = item.NextRefreshDate,
            LastRefreshedAt = item.LastRefreshedAt,
            RefreshCount = item.RefreshCount,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
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
        var item = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (item == null) return null;

        return new WorkItemDto
        {
            Id = item.Id,
            WorkItemNumber = item.WorkItemNumber,
            ApplicationId = item.ApplicationId,
            ApplicantName = item.ApplicantName,
            EntityType = item.EntityType,
            Country = item.Country,
            Status = WorkItemStatusMapper.MapStatusToApiString(item.Status), // item.Status is Domain.Aggregates.WorkItemStatus
            Priority = item.Priority.ToString(),
            RiskLevel = item.RiskLevel.ToString(),
            AssignedTo = item.AssignedTo,
            AssignedToName = item.AssignedToName,
            AssignedAt = item.AssignedAt,
            RequiresApproval = item.RequiresApproval,
            ApprovedBy = item.ApprovedBy,
            ApprovedByName = item.ApprovedByName,
            ApprovedAt = item.ApprovedAt,
            RejectionReason = item.RejectionReason,
            DueDate = item.DueDate,
            IsOverdue = item.DueDate < DateTime.UtcNow && item.Status != Domain.Aggregates.WorkItemStatus.Approved && item.Status != Domain.Aggregates.WorkItemStatus.Completed,
            NextRefreshDate = item.NextRefreshDate,
            LastRefreshedAt = item.LastRefreshedAt,
            RefreshCount = item.RefreshCount,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
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
        var items = await _repository.GetByAssigneeAsync(request.UserId, cancellationToken);
        
        var totalCount = items.Count;
        
        var pagedItems = items
            .OrderByDescending(w => w.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(item => new WorkItemDto
        {
            Id = item.Id,
            WorkItemNumber = item.WorkItemNumber,
            ApplicationId = item.ApplicationId,
            ApplicantName = item.ApplicantName,
            EntityType = item.EntityType,
            Country = item.Country,
            Status = WorkItemStatusMapper.MapStatusToApiString(item.Status), // item.Status is Domain.Aggregates.WorkItemStatus
            Priority = item.Priority.ToString(),
            RiskLevel = item.RiskLevel.ToString(),
            AssignedTo = item.AssignedTo,
            AssignedToName = item.AssignedToName,
            AssignedAt = item.AssignedAt,
            RequiresApproval = item.RequiresApproval,
            ApprovedBy = item.ApprovedBy,
            ApprovedByName = item.ApprovedByName,
            ApprovedAt = item.ApprovedAt,
            RejectionReason = item.RejectionReason,
            DueDate = item.DueDate,
            IsOverdue = item.DueDate < DateTime.UtcNow && item.Status != Domain.Aggregates.WorkItemStatus.Approved && item.Status != Domain.Aggregates.WorkItemStatus.Completed,
            NextRefreshDate = item.NextRefreshDate,
            RefreshCount = item.RefreshCount,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        }).ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = dtos,
            TotalCount = totalCount,
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
        var allItems = await _repository.GetAllAsync(cancellationToken);
        var asOfDate = request.AsOfDate ?? DateTime.UtcNow;
        
        // Filter items that are due for refresh (NextRefreshDate <= asOfDate or null but should have been refreshed)
        var filtered = allItems
            .Where(w => 
                (w.NextRefreshDate.HasValue && w.NextRefreshDate.Value <= asOfDate) ||
                (w.Status == Domain.Aggregates.WorkItemStatus.DueForRefresh)
            )
            .AsQueryable();

        var totalCount = filtered.Count();
        
        // Apply pagination
        var pagedItems = filtered
            .OrderBy(w => w.NextRefreshDate ?? DateTime.MaxValue) // Overdue first
            .ThenByDescending(w => w.Priority)
            .ThenByDescending(w => w.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedItems.Select(item => new WorkItemDto
        {
            Id = item.Id,
            WorkItemNumber = item.WorkItemNumber,
            ApplicationId = item.ApplicationId,
            ApplicantName = item.ApplicantName,
            EntityType = item.EntityType,
            Country = item.Country,
            Status = WorkItemStatusMapper.MapStatusToApiString(item.Status),
            Priority = item.Priority.ToString(),
            RiskLevel = item.RiskLevel.ToString(),
            AssignedTo = item.AssignedTo,
            AssignedToName = item.AssignedToName,
            AssignedAt = item.AssignedAt,
            RequiresApproval = item.RequiresApproval,
            ApprovedBy = item.ApprovedBy,
            ApprovedByName = item.ApprovedByName,
            ApprovedAt = item.ApprovedAt,
            RejectionReason = item.RejectionReason,
            DueDate = item.DueDate,
            IsOverdue = item.DueDate < DateTime.UtcNow && item.Status != Domain.Aggregates.WorkItemStatus.Approved && item.Status != Domain.Aggregates.WorkItemStatus.Completed,
            NextRefreshDate = item.NextRefreshDate,
            LastRefreshedAt = item.LastRefreshedAt,
            RefreshCount = item.RefreshCount,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        }).ToList();

        return new PagedResult<WorkItemDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

/// <summary>
/// Handler for GetWorkItemHistoryQuery
/// </summary>
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

        return workItem.History.Select(h => new WorkItemHistoryDto
        {
            Id = h.Id,
            Action = h.Action,
            PerformedBy = h.PerformedBy,
            PerformedAt = h.PerformedAt,
            Status = WorkItemStatusMapper.MapStatusToApiString(h.Status)
        }).ToList();
    }
}

/// <summary>
/// Handler for GetWorkItemCommentsQuery
/// </summary>
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

        return workItem.Comments.Select(c => new WorkItemCommentDto
        {
            Id = c.Id,
            Text = c.Text,
            AuthorId = c.AuthorId,
            AuthorName = c.AuthorName,
            CreatedAt = c.CreatedAt
        }).ToList();
    }
}

// Helper method to map domain status to API status string
public static class WorkItemStatusMapper
{
    public static string MapStatusToApiString(Domain.Aggregates.WorkItemStatus status)
    {
        return status switch
        {
            Domain.Aggregates.WorkItemStatus.New => "New",
            Domain.Aggregates.WorkItemStatus.Assigned => "Assigned",
            Domain.Aggregates.WorkItemStatus.InProgress => "InProgress",
            Domain.Aggregates.WorkItemStatus.PendingApproval => "PendingApproval",
            Domain.Aggregates.WorkItemStatus.Approved => "Approved",
            Domain.Aggregates.WorkItemStatus.Completed => "Completed",
            Domain.Aggregates.WorkItemStatus.Declined => "Declined",
            Domain.Aggregates.WorkItemStatus.Cancelled => "Cancelled",
            Domain.Aggregates.WorkItemStatus.DueForRefresh => "DueForRefresh",
            _ => "New"
        };
    }
}

