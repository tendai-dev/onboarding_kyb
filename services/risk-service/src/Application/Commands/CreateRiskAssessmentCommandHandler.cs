using RiskService.Application.Interfaces;
using RiskService.Domain.Aggregates;
using MediatR;

namespace RiskService.Application.Commands;

public class CreateRiskAssessmentCommandHandler : IRequestHandler<CreateRiskAssessmentCommand, CreateRiskAssessmentResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public CreateRiskAssessmentCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateRiskAssessmentResult> Handle(CreateRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        // Check if assessment already exists for this case
        var existingAssessment = await _repository.GetByCaseIdAsync(request.CaseId, cancellationToken);
        if (existingAssessment != null)
            throw new InvalidOperationException($"Risk assessment already exists for case {request.CaseId}");

        // Create new assessment
        var assessment = RiskAssessment.Create(request.CaseId, request.PartnerId);

        // Save to repository
        await _repository.AddAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CreateRiskAssessmentResult(
            assessment.Id.Value,
            assessment.CaseId,
            assessment.PartnerId,
            assessment.Status.ToString());
    }
}
