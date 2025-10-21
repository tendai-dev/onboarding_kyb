using ChecklistService.Application.Interfaces;
using ChecklistService.Domain.ValueObjects;
using MediatR;

namespace ChecklistService.Application.Queries;

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
