using MediatR;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public class CompleteChecklistItemCommandHandler : IRequestHandler<CompleteChecklistItemCommand, CompleteChecklistItemResult>
{
    private readonly IChecklistRepository _repository;

    public CompleteChecklistItemCommandHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<CompleteChecklistItemResult> Handle(CompleteChecklistItemCommand request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByIdAsync(ChecklistId.From(request.ChecklistId), cancellationToken);
        if (checklist == null)
            throw new InvalidOperationException($"Checklist {request.ChecklistId} not found");

        checklist.CompleteItem(ChecklistItemId.From(request.ItemId), request.CompletedBy, request.Notes);

        await _repository.UpdateAsync(checklist, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CompleteChecklistItemResult(
            checklist.Id.Value,
            request.ItemId,
            checklist.Status == Domain.Checklist.ValueObjects.ChecklistStatus.Completed,
            checklist.GetCompletionPercentage());
    }
}

