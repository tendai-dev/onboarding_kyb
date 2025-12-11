using MediatR;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public class ResetChecklistItemCommandHandler : IRequestHandler<ResetChecklistItemCommand, ResetChecklistItemResult>
{
    private readonly IChecklistRepository _repository;

    public ResetChecklistItemCommandHandler(IChecklistRepository repository)
    {
        _repository = repository;
    }

    public async Task<ResetChecklistItemResult> Handle(ResetChecklistItemCommand request, CancellationToken cancellationToken)
    {
        var checklist = await _repository.GetByIdAsync(ChecklistId.From(request.ChecklistId), cancellationToken);
        if (checklist == null)
            throw new InvalidOperationException($"Checklist {request.ChecklistId} not found");

        checklist.ResetItem(ChecklistItemId.From(request.ItemId), request.ResetBy, request.Reason);

        await _repository.UpdateAsync(checklist, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new ResetChecklistItemResult(checklist.Id.Value, request.ItemId, true);
    }
}

