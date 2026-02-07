using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Commands;

public class DeleteChecklistCommandHandler : IRequestHandler<DeleteChecklistCommand, bool>
{
    private readonly IChecklistRepository _checklistRepository;
    private readonly ILogger<DeleteChecklistCommandHandler> _logger;

    public DeleteChecklistCommandHandler(
        IChecklistRepository checklistRepository,
        ILogger<DeleteChecklistCommandHandler> logger)
    {
        _checklistRepository = checklistRepository;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteChecklistCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting checklist {ChecklistId}", request.ChecklistId);

        var checklistId = ChecklistId.From(request.ChecklistId);
        var checklist = await _checklistRepository.GetByIdAsync(checklistId, cancellationToken);

        if (checklist == null)
        {
            _logger.LogWarning("Checklist {ChecklistId} not found", request.ChecklistId);
            return false;
        }

        await _checklistRepository.DeleteAsync(checklist, cancellationToken);
        await _checklistRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully deleted checklist {ChecklistId}", request.ChecklistId);
        return true;
    }
}
