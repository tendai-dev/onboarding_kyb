using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.Aggregates;
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

public record GetWorkItemByApplicationIdQuery(
    Guid ApplicationId
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
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly IOnboardingCaseRepository _caseRepository;
    private readonly ILogger<GetWorkItemsQueryHandler> _logger;

    public GetWorkItemsQueryHandler(
        IWorkItemRepository repository,
        IEntityTypeRepository entityTypeRepository,
        IOnboardingCaseRepository caseRepository,
        ILogger<GetWorkItemsQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _caseRepository = caseRepository;
        _logger = logger;
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
        
        // Get unique entity type codes to batch lookup display names
        var entityTypeCodes = workItems
            .Select(wi => wi.EntityType)
            .Where(et => !string.IsNullOrWhiteSpace(et))
            .Distinct()
            .ToList();
        
        // Batch lookup entity type display names
        var entityTypeDisplayNames = new Dictionary<string, string?>();
        foreach (var code in entityTypeCodes)
        {
            try
            {
                var entityType = await _entityTypeRepository.GetByCodeAsync(code, cancellationToken);
                entityTypeDisplayNames[code] = entityType?.DisplayName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup entity type display name for code: {Code}", code);
                entityTypeDisplayNames[code] = null;
            }
        }
        
        // Enrich work items with case data when values are "Unknown" or missing
        var enrichedWorkItems = new List<WorkItemDto>();
        var pagedWorkItems = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        foreach (var wi in pagedWorkItems)
        {
            var dto = await MapToDtoAsync(wi, entityTypeDisplayNames, cancellationToken);
            enrichedWorkItems.Add(dto);
        }

        return new PagedResult<WorkItemDto>
        {
            Items = enrichedWorkItems,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    private async Task<WorkItemDto> MapToDtoAsync(
        WorkItem wi, 
        Dictionary<string, string?> entityTypeDisplayNames,
        CancellationToken cancellationToken)
    {
        entityTypeDisplayNames.TryGetValue(wi.EntityType, out var displayName);
        
        // If work item has "Unknown" values, try to enrich from case
        var applicantName = wi.ApplicantName;
        var businessName = wi.BusinessName;
        var entityType = wi.EntityType;
        var country = wi.Country;
        var riskLevel = wi.RiskLevel;

        if (applicantName == "Unknown" || applicantName == "Unknown Applicant" || 
            entityType == "Unknown" || country == "Unknown" ||
            riskLevel == RiskLevel.Unknown || string.IsNullOrWhiteSpace(businessName))
        {
            try
            {
                var caseEntity = await _caseRepository.GetByIdAsync(wi.ApplicationId, cancellationToken);
                if (caseEntity != null)
                {
                    // Enrich applicant name
                    if (applicantName == "Unknown" || applicantName == "Unknown Applicant")
                    {
                        applicantName = $"{caseEntity.Applicant.FirstName} {caseEntity.Applicant.LastName}".Trim();
                        if (string.IsNullOrWhiteSpace(applicantName) && caseEntity.Business != null)
                        {
                            applicantName = caseEntity.Business.LegalName ?? applicantName;
                        }
                        if (string.IsNullOrWhiteSpace(applicantName))
                        {
                            applicantName = wi.ApplicantName; // Keep original if still empty
                        }
                    }

                    // Enrich business name
                    if (string.IsNullOrWhiteSpace(businessName) && caseEntity.Business != null)
                    {
                        businessName = caseEntity.Business.LegalName;
                    }

                    // Enrich entity type
                    if (entityType == "Unknown")
                    {
                        entityType = caseEntity.Type == OnboardingType.Business ? "Business" : "Individual";
                        if (caseEntity.Metadata != null && caseEntity.Metadata.TryGetValue("entity_type_code", out var entityTypeCode))
                        {
                            entityType = entityTypeCode;
                        }
                        // Update display name for new entity type
                        if (!string.IsNullOrWhiteSpace(entityType) && entityType != "Unknown")
                        {
                            try
                            {
                                var et = await _entityTypeRepository.GetByCodeAsync(entityType, cancellationToken);
                                displayName = et?.DisplayName;
                            }
                            catch
                            {
                                // Ignore errors in display name lookup
                            }
                        }
                    }

                    // Enrich country
                    if (country == "Unknown")
                    {
                        country = caseEntity.Applicant?.ResidentialAddress?.Country ?? 
                                 caseEntity.Business?.RegisteredAddress?.Country ?? 
                                 country;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to enrich work item {WorkItemId} from case {CaseId}", wi.Id, wi.ApplicationId);
            }
        }
        
        return new WorkItemDto
        {
            Id = wi.Id,
            WorkItemNumber = wi.WorkItemNumber,
            ApplicationId = wi.ApplicationId,
            ApplicantName = applicantName,
            BusinessName = businessName,
            EntityType = entityType,
            EntityTypeDisplayName = displayName,
            Country = country,
            Status = wi.Status.ToString(),
            Priority = wi.Priority.ToString(),
            RiskLevel = riskLevel.ToString(),
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
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly ILogger<GetWorkItemByIdQueryHandler> _logger;

    public GetWorkItemByIdQueryHandler(
        IWorkItemRepository repository,
        IEntityTypeRepository entityTypeRepository,
        ILogger<GetWorkItemByIdQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _logger = logger;
    }

    public async Task<WorkItemDto?> Handle(GetWorkItemByIdQuery request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return null;

        // Lookup entity type display name
        string? entityTypeDisplayName = null;
        if (!string.IsNullOrWhiteSpace(workItem.EntityType))
        {
            try
            {
                var entityType = await _entityTypeRepository.GetByCodeAsync(workItem.EntityType, cancellationToken);
                entityTypeDisplayName = entityType?.DisplayName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup entity type display name for code: {Code}", workItem.EntityType);
            }
        }

        return new WorkItemDto
        {
            Id = workItem.Id,
            WorkItemNumber = workItem.WorkItemNumber,
            ApplicationId = workItem.ApplicationId,
            ApplicantName = workItem.ApplicantName,
            BusinessName = workItem.BusinessName,
            EntityType = workItem.EntityType,
            EntityTypeDisplayName = entityTypeDisplayName,
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

public class GetWorkItemByApplicationIdQueryHandler : IRequestHandler<GetWorkItemByApplicationIdQuery, WorkItemDto?>
{
    private readonly IWorkItemRepository _repository;
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly IOnboardingCaseRepository _caseRepository;
    private readonly ILogger<GetWorkItemByApplicationIdQueryHandler> _logger;

    public GetWorkItemByApplicationIdQueryHandler(
        IWorkItemRepository repository,
        IEntityTypeRepository entityTypeRepository,
        IOnboardingCaseRepository caseRepository,
        ILogger<GetWorkItemByApplicationIdQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _caseRepository = caseRepository;
        _logger = logger;
    }

    public async Task<WorkItemDto?> Handle(GetWorkItemByApplicationIdQuery request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByApplicationIdAsync(request.ApplicationId, cancellationToken);
        if (workItem == null)
            return null;

        // Lookup entity type display name
        string? entityTypeDisplayName = null;
        if (!string.IsNullOrWhiteSpace(workItem.EntityType))
        {
            try
            {
                var entityTypeEntity = await _entityTypeRepository.GetByCodeAsync(workItem.EntityType, cancellationToken);
                entityTypeDisplayName = entityTypeEntity?.DisplayName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup entity type display name for code: {Code}", workItem.EntityType);
            }
        }

        // Enrich data from OnboardingCase if needed (same logic as GetWorkItemsQueryHandler)
        string applicantName = workItem.ApplicantName;
        string? businessName = workItem.BusinessName;
        string entityType = workItem.EntityType;
        string country = workItem.Country;
        string riskLevel = workItem.RiskLevel.ToString();

        if (applicantName == "Unknown" || string.IsNullOrWhiteSpace(businessName) || entityType == "Unknown" || country == "Unknown" || riskLevel == "Unknown")
        {
            var caseEntity = await _caseRepository.GetByIdAsync(workItem.ApplicationId, cancellationToken);
            if (caseEntity != null)
            {
                applicantName = $"{caseEntity.Applicant.FirstName} {caseEntity.Applicant.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(applicantName))
                {
                    applicantName = caseEntity.Business?.LegalName ?? "Unknown Applicant";
                }
                
                businessName = caseEntity.Business?.LegalName;
                entityType = caseEntity.Type == OnboardingType.Business ? "Business" : "Individual";
                if (caseEntity.Metadata != null && caseEntity.Metadata.TryGetValue("entity_type_code", out var entityTypeCode))
                {
                    entityType = entityTypeCode;
                }
                country = caseEntity.Applicant?.ResidentialAddress?.Country ??
                          caseEntity.Business?.RegisteredAddress?.Country ??
                          "Unknown";
                // Risk level is stored on the work item, not the case - keep the work item's risk level
                // riskLevel remains as workItem.RiskLevel.ToString()
            }
        }

        return new WorkItemDto
        {
            Id = workItem.Id,
            WorkItemNumber = workItem.WorkItemNumber,
            ApplicationId = workItem.ApplicationId,
            ApplicantName = applicantName,
            BusinessName = businessName,
            EntityType = entityType,
            EntityTypeDisplayName = entityTypeDisplayName,
            Country = country,
            Status = workItem.Status.ToString(),
            Priority = workItem.Priority.ToString(),
            RiskLevel = riskLevel,
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
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly ILogger<GetMyWorkItemsQueryHandler> _logger;

    public GetMyWorkItemsQueryHandler(
        IWorkItemRepository repository,
        IEntityTypeRepository entityTypeRepository,
        ILogger<GetMyWorkItemsQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _logger = logger;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetMyWorkItemsQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetByAssignedUserAsync(request.UserId, cancellationToken);
        
        // Get unique entity type codes to batch lookup display names
        var entityTypeCodes = workItems
            .Select(wi => wi.EntityType)
            .Where(et => !string.IsNullOrWhiteSpace(et))
            .Distinct()
            .ToList();
        
        // Batch lookup entity type display names
        var entityTypeDisplayNames = new Dictionary<string, string?>();
        foreach (var code in entityTypeCodes)
        {
            try
            {
                var entityType = await _entityTypeRepository.GetByCodeAsync(code, cancellationToken);
                entityTypeDisplayNames[code] = entityType?.DisplayName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup entity type display name for code: {Code}", code);
                entityTypeDisplayNames[code] = null;
            }
        }
        
        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => {
                entityTypeDisplayNames.TryGetValue(wi.EntityType, out var displayName);
                return new WorkItemDto
                {
                    Id = wi.Id,
                    WorkItemNumber = wi.WorkItemNumber,
                    ApplicationId = wi.ApplicationId,
                    ApplicantName = wi.ApplicantName,
                    BusinessName = wi.BusinessName,
                    EntityType = wi.EntityType,
                    EntityTypeDisplayName = displayName,
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
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly ILogger<GetPendingApprovalsQueryHandler> _logger;

    public GetPendingApprovalsQueryHandler(
        IWorkItemRepository repository,
        IEntityTypeRepository entityTypeRepository,
        ILogger<GetPendingApprovalsQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _logger = logger;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetPendingApprovalsQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetPendingApprovalsAsync(request.MinimumRiskLevel, cancellationToken);
        
        // Get unique entity type codes to batch lookup display names
        var entityTypeCodes = workItems
            .Select(wi => wi.EntityType)
            .Where(et => !string.IsNullOrWhiteSpace(et))
            .Distinct()
            .ToList();
        
        // Batch lookup entity type display names
        var entityTypeDisplayNames = new Dictionary<string, string?>();
        foreach (var code in entityTypeCodes)
        {
            try
            {
                var entityType = await _entityTypeRepository.GetByCodeAsync(code, cancellationToken);
                entityTypeDisplayNames[code] = entityType?.DisplayName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup entity type display name for code: {Code}", code);
                entityTypeDisplayNames[code] = null;
            }
        }
        
        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => {
                entityTypeDisplayNames.TryGetValue(wi.EntityType, out var displayName);
                return new WorkItemDto
                {
                    Id = wi.Id,
                    WorkItemNumber = wi.WorkItemNumber,
                    ApplicationId = wi.ApplicationId,
                    ApplicantName = wi.ApplicantName,
                    BusinessName = wi.BusinessName,
                    EntityType = wi.EntityType,
                    EntityTypeDisplayName = displayName,
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
    private readonly IEntityTypeRepository _entityTypeRepository;
    private readonly ILogger<GetItemsDueForRefreshQueryHandler> _logger;

    public GetItemsDueForRefreshQueryHandler(
        IWorkItemRepository repository,
        IEntityTypeRepository entityTypeRepository,
        ILogger<GetItemsDueForRefreshQueryHandler> logger)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
        _logger = logger;
    }

    public async Task<PagedResult<WorkItemDto>> Handle(GetItemsDueForRefreshQuery request, CancellationToken cancellationToken)
    {
        var workItems = await _repository.GetItemsDueForRefreshAsync(request.AsOfDate, cancellationToken);
        
        // Get unique entity type codes to batch lookup display names
        var entityTypeCodes = workItems
            .Select(wi => wi.EntityType)
            .Where(et => !string.IsNullOrWhiteSpace(et))
            .Distinct()
            .ToList();
        
        // Batch lookup entity type display names
        var entityTypeDisplayNames = new Dictionary<string, string?>();
        foreach (var code in entityTypeCodes)
        {
            try
            {
                var entityType = await _entityTypeRepository.GetByCodeAsync(code, cancellationToken);
                entityTypeDisplayNames[code] = entityType?.DisplayName;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to lookup entity type display name for code: {Code}", code);
                entityTypeDisplayNames[code] = null;
            }
        }
        
        var total = workItems.Count;
        var paged = workItems
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(wi => {
                entityTypeDisplayNames.TryGetValue(wi.EntityType, out var displayName);
                return new WorkItemDto
                {
                    Id = wi.Id,
                    WorkItemNumber = wi.WorkItemNumber,
                    ApplicationId = wi.ApplicationId,
                    ApplicantName = wi.ApplicantName,
                    BusinessName = wi.BusinessName,
                    EntityType = wi.EntityType,
                    EntityTypeDisplayName = displayName,
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
    public string? BusinessName { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string? EntityTypeDisplayName { get; init; }
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

public record GetStepReviewStatusQuery(
    Guid WorkItemId
) : IRequest<GetStepReviewStatusResult>;

public record GetStepReviewStatusResult
{
    public bool Success { get; init; }
    public Dictionary<string, StepReviewStatusDto>? StepReviews { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static GetStepReviewStatusResult Successful(Dictionary<string, StepReviewStatusDto> stepReviews) => new() { Success = true, StepReviews = stepReviews };
    public static GetStepReviewStatusResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record StepReviewStatusDto
{
    public string StepId { get; init; } = string.Empty;
    public bool Completed { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? CompletedBy { get; init; }
    public bool Verified { get; init; }
    public DateTime? VerifiedAt { get; init; }
    public string? VerifiedBy { get; init; }
    public bool Approved { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public string? ApprovedBy { get; init; }
    public string? Notes { get; init; }
}

public class GetStepReviewStatusQueryHandler : IRequestHandler<GetStepReviewStatusQuery, GetStepReviewStatusResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<GetStepReviewStatusQueryHandler> _logger;

    public GetStepReviewStatusQueryHandler(
        IWorkItemRepository repository,
        ILogger<GetStepReviewStatusQueryHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<GetStepReviewStatusResult> Handle(GetStepReviewStatusQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var reviews = await _repository.GetStepReviewsAsync(request.WorkItemId, cancellationToken);

            var stepReviews = reviews.ToDictionary(
                r => r.StepId,
                r => new StepReviewStatusDto
                {
                    StepId = r.StepId,
                    Completed = r.Completed,
                    CompletedAt = r.CompletedAt,
                    CompletedBy = r.CompletedBy,
                    Verified = r.Verified,
                    VerifiedAt = r.VerifiedAt,
                    VerifiedBy = r.VerifiedBy,
                    Approved = r.Approved,
                    ApprovedAt = r.ApprovedAt,
                    ApprovedBy = r.ApprovedBy,
                    Notes = r.Notes
                }
            );

            return GetStepReviewStatusResult.Successful(stepReviews);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting step review status for WorkItemId={WorkItemId}", request.WorkItemId);
            return GetStepReviewStatusResult.Failed(ex.Message);
        }
    }
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

