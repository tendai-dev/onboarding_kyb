using MediatR;
using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;

namespace RiskService.Application.Commands;

public record UpdateRiskFactorCommand(
    Guid AssessmentId,
    Guid FactorId,
    RiskLevel Level,
    decimal Score,
    string Description
) : IRequest<UpdateRiskFactorResult>;

public record UpdateRiskFactorResult(bool Success);

public class UpdateRiskFactorCommandHandler : IRequestHandler<UpdateRiskFactorCommand, UpdateRiskFactorResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public UpdateRiskFactorCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateRiskFactorResult> Handle(UpdateRiskFactorCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null) throw new InvalidOperationException("Assessment not found");

        assessment.UpdateRiskFactor(RiskFactorId.From(request.FactorId), request.Level, request.Score, request.Description);
        await _repository.SaveChangesAsync(cancellationToken);
        return new UpdateRiskFactorResult(true);
    }
}
