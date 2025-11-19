using MediatR;
using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;

namespace RiskService.Application.Commands;

public record UpdateRiskAssessmentNotesCommand(
    Guid AssessmentId,
    string? Notes = null) : IRequest<UpdateRiskAssessmentNotesResult>;

public record UpdateRiskAssessmentNotesResult(
    Guid AssessmentId,
    string CaseId,
    bool Success);

public class UpdateRiskAssessmentNotesCommandHandler : IRequestHandler<UpdateRiskAssessmentNotesCommand, UpdateRiskAssessmentNotesResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public UpdateRiskAssessmentNotesCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateRiskAssessmentNotesResult> Handle(UpdateRiskAssessmentNotesCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.UpdateNotes(request.Notes);

        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new UpdateRiskAssessmentNotesResult(
            assessment.Id.Value,
            assessment.CaseId,
            true);
    }
}

