using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Application.Commands;

public class AddRiskFactorCommandHandler : IRequestHandler<AddRiskFactorCommand, AddRiskFactorResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public AddRiskFactorCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<AddRiskFactorResult> Handle(AddRiskFactorCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        // Add the risk factor
        assessment.AddRiskFactor(
            request.Type,
            request.Level,
            request.Score,
            request.Description,
            request.Source);

        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Get the newly added factor ID (last one added)
        var newFactor = assessment.Factors.OrderByDescending(f => f.CreatedAt).First();

        return new AddRiskFactorResult(
            assessment.Id.Value,
            newFactor.Id.Value,
            assessment.RiskScore,
            assessment.OverallRiskLevel.ToString());
    }
}
