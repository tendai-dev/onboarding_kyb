using MediatR;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Queries;

public class GetChecklistQueryHandler : IRequestHandler<GetChecklistQuery, ChecklistDto?>
{
    private readonly IChecklistRepository _repository;

    public GetChecklistQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<ChecklistDto?> Handle(GetChecklistQuery request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByIdAsync(ChecklistId.From(request.ChecklistId), cancellationToken);
        if (checklist == null)
            return null;

        return MapToDto(checklist);
    }

    private static ChecklistDto MapToDto(Domain.Checklist.Aggregates.Checklist checklist)
    {
        return new ChecklistDto
        {
            Id = checklist.Id.Value,
            CaseId = checklist.CaseId,
            Type = checklist.Type.ToString(),
            Status = checklist.Status.ToString(),
            PartnerId = checklist.PartnerId,
            CreatedAt = checklist.CreatedAt,
            CompletedAt = checklist.CompletedAt,
            CompletionPercentage = checklist.GetCompletionPercentage(),
            RequiredCompletionPercentage = checklist.GetRequiredCompletionPercentage(),
            Items = checklist.Items.OrderBy(i => i.Order).Select(item => new ChecklistItemDto
            {
                Id = item.Id.Value,
                Name = item.Name,
                Description = item.Description,
                Category = item.Category.ToString(),
                IsRequired = item.IsRequired,
                Order = item.Order,
                Status = item.Status.ToString(),
                CreatedAt = item.CreatedAt,
                CompletedAt = item.CompletedAt,
                CompletedBy = item.CompletedBy,
                Notes = item.Notes,
                SkipReason = item.SkipReason
            }).ToList()
        };
    }
}

public class GetChecklistByCaseQueryHandler : IRequestHandler<GetChecklistByCaseQuery, ChecklistDto?>
{
    private readonly IChecklistRepository _repository;

    public GetChecklistByCaseQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<ChecklistDto?> Handle(GetChecklistByCaseQuery request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByCaseIdAsync(request.CaseId, cancellationToken);
        if (checklist == null)
            return null;

        return new ChecklistDto
        {
            Id = checklist.Id.Value,
            CaseId = checklist.CaseId,
            Type = checklist.Type.ToString(),
            Status = checklist.Status.ToString(),
            PartnerId = checklist.PartnerId,
            CreatedAt = checklist.CreatedAt,
            CompletedAt = checklist.CompletedAt,
            CompletionPercentage = checklist.GetCompletionPercentage(),
            RequiredCompletionPercentage = checklist.GetRequiredCompletionPercentage(),
            Items = checklist.Items.OrderBy(i => i.Order).Select(item => new ChecklistItemDto
            {
                Id = item.Id.Value,
                Name = item.Name,
                Description = item.Description,
                Category = item.Category.ToString(),
                IsRequired = item.IsRequired,
                Order = item.Order,
                Status = item.Status.ToString(),
                CreatedAt = item.CreatedAt,
                CompletedAt = item.CompletedAt,
                CompletedBy = item.CompletedBy,
                Notes = item.Notes,
                SkipReason = item.SkipReason
            }).ToList()
        };
    }
}

public class GetAllChecklistsQueryHandler : IRequestHandler<GetAllChecklistsQuery, List<ChecklistDto>>
{
    private readonly IChecklistRepository _repository;

    public GetAllChecklistsQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ChecklistDto>> Handle(GetAllChecklistsQuery request, CancellationToken cancellationToken)
    {
        var checklists = await _repository.GetAllAsync(cancellationToken);
        return checklists.Select(c => new ChecklistDto
        {
            Id = c.Id.Value,
            CaseId = c.CaseId,
            Type = c.Type.ToString(),
            Status = c.Status.ToString(),
            PartnerId = c.PartnerId,
            CreatedAt = c.CreatedAt,
            CompletedAt = c.CompletedAt,
            CompletionPercentage = c.GetCompletionPercentage(),
            RequiredCompletionPercentage = c.GetRequiredCompletionPercentage(),
            Items = c.Items.OrderBy(i => i.Order).Select(item => new ChecklistItemDto
            {
                Id = item.Id.Value,
                Name = item.Name,
                Description = item.Description,
                Category = item.Category.ToString(),
                IsRequired = item.IsRequired,
                Order = item.Order,
                Status = item.Status.ToString(),
                CreatedAt = item.CreatedAt,
                CompletedAt = item.CompletedAt,
                CompletedBy = item.CompletedBy,
                Notes = item.Notes,
                SkipReason = item.SkipReason
            }).ToList()
        }).ToList();
    }
}

public class GetChecklistsByPartnerQueryHandler : IRequestHandler<GetChecklistsByPartnerQuery, List<ChecklistDto>>
{
    private readonly IChecklistRepository _repository;

    public GetChecklistsByPartnerQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ChecklistDto>> Handle(GetChecklistsByPartnerQuery request, CancellationToken cancellationToken)
    {
        var checklists = await _repository.GetByPartnerIdAsync(request.PartnerId, cancellationToken);
        return checklists.Select(c => new ChecklistDto
        {
            Id = c.Id.Value,
            CaseId = c.CaseId,
            Type = c.Type.ToString(),
            Status = c.Status.ToString(),
            PartnerId = c.PartnerId,
            CreatedAt = c.CreatedAt,
            CompletedAt = c.CompletedAt,
            CompletionPercentage = c.GetCompletionPercentage(),
            RequiredCompletionPercentage = c.GetRequiredCompletionPercentage(),
            Items = c.Items.OrderBy(i => i.Order).Select(item => new ChecklistItemDto
            {
                Id = item.Id.Value,
                Name = item.Name,
                Description = item.Description,
                Category = item.Category.ToString(),
                IsRequired = item.IsRequired,
                Order = item.Order,
                Status = item.Status.ToString(),
                CreatedAt = item.CreatedAt,
                CompletedAt = item.CompletedAt,
                CompletedBy = item.CompletedBy,
                Notes = item.Notes,
                SkipReason = item.SkipReason
            }).ToList()
        }).ToList();
    }
}

public class GetChecklistProgressQueryHandler : IRequestHandler<GetChecklistProgressQuery, ChecklistProgressDto>
{
    private readonly IChecklistRepository _repository;

    public GetChecklistProgressQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<ChecklistProgressDto> Handle(GetChecklistProgressQuery request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByIdAsync(ChecklistId.From(request.ChecklistId), cancellationToken);
        if (checklist == null)
            throw new InvalidOperationException($"Checklist {request.ChecklistId} not found");

        var items = checklist.Items.ToList();
        return new ChecklistProgressDto
        {
            ChecklistId = checklist.Id.Value,
            TotalItems = items.Count,
            CompletedItems = items.Count(i => i.Status == ChecklistItemStatus.Completed),
            SkippedItems = items.Count(i => i.Status == ChecklistItemStatus.Skipped),
            PendingItems = items.Count(i => i.Status == ChecklistItemStatus.Pending),
            CompletionPercentage = checklist.GetCompletionPercentage(),
            RequiredCompletionPercentage = checklist.GetRequiredCompletionPercentage(),
            IsCompleted = checklist.Status == ChecklistStatus.Completed
        };
    }
}

