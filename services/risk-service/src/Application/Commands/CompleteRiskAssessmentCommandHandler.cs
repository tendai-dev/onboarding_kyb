using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Commands;

public class CompleteRiskAssessmentCommandHandler : IRequestHandler<CompleteRiskAssessmentCommand, CompleteRiskAssessmentResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public CompleteRiskAssessmentCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<CompleteRiskAssessmentResult> Handle(CompleteRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.CompleteAssessment(request.AssessedBy, request.Notes);

        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CompleteRiskAssessmentResult(
            assessment.Id.Value,
            assessment.CaseId,
            assessment.OverallRiskLevel.ToString(),
            assessment.RiskScore,
            assessment.CompletedAt!.Value);
    }
}
