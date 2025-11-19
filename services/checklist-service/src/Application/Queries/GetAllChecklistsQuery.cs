using MediatR;
using ChecklistService.Application.Interfaces;

namespace ChecklistService.Application.Queries;

public record GetAllChecklistsQuery : IRequest<IEnumerable<ChecklistDto>>;

public class GetAllChecklistsQueryHandler : IRequestHandler<GetAllChecklistsQuery, IEnumerable<ChecklistDto>>
{
    private readonly IChecklistRepository _repository;

    public GetAllChecklistsQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ChecklistDto>> Handle(GetAllChecklistsQuery request, CancellationToken cancellationToken)
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
        });
    }
}

