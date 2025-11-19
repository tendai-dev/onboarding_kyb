using MediatR;
using ChecklistService.Application.Interfaces;
using ChecklistService.Domain.ValueObjects;
using ChecklistService.Domain.Aggregates;

namespace ChecklistService.Application.Queries;

public record GetChecklistProgressQuery(Guid ChecklistId) : IRequest<GetChecklistProgressResult>;

public record GetChecklistProgressResult(
    Guid ChecklistId,
    double CompletionPercentage,
    double RequiredCompletionPercentage,
    int TotalItems,
    int CompletedItems
);

public class GetChecklistProgressQueryHandler : IRequestHandler<GetChecklistProgressQuery, GetChecklistProgressResult>
{
    private readonly IChecklistRepository _repository;

    public GetChecklistProgressQueryHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<GetChecklistProgressResult> Handle(GetChecklistProgressQuery request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByIdAsync(ChecklistId.From(request.ChecklistId), cancellationToken);
        if (checklist == null)
            throw new InvalidOperationException($"Checklist {request.ChecklistId} not found");

        var total = checklist.Items.Count;
        var completed = checklist.Items.Count(i => i.Status == ChecklistItemStatus.Completed);

        return new GetChecklistProgressResult(
            checklist.Id.Value,
            checklist.GetCompletionPercentage(),
            checklist.GetRequiredCompletionPercentage(),
            total,
            completed);
    }
}
