using MediatR;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public class SkipChecklistItemCommandHandler : IRequestHandler<SkipChecklistItemCommand, SkipChecklistItemResult>
{
    private readonly IChecklistRepository _repository;

    public SkipChecklistItemCommandHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<SkipChecklistItemResult> Handle(SkipChecklistItemCommand request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByIdAsync(ChecklistId.From(request.ChecklistId), cancellationToken);
        if (checklist == null)
            throw new InvalidOperationException($"Checklist {request.ChecklistId} not found");

        checklist.SkipItem(ChecklistItemId.From(request.ItemId), request.SkippedBy, request.Reason);

        await _repository.UpdateAsync(checklist, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new SkipChecklistItemResult(checklist.Id.Value, request.ItemId, true);
    }
}

