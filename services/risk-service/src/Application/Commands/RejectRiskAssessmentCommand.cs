using MediatR;
using RiskService.Application.Interfaces;
using RiskService.Domain.ValueObjects;

namespace RiskService.Application.Commands;

public record RejectRiskAssessmentCommand(
    Guid AssessmentId,
    string RejectedBy,
    string Reason
) : IRequest<RejectRiskAssessmentResult>;

public record RejectRiskAssessmentResult(bool Success);

public class RejectRiskAssessmentCommandHandler : IRequestHandler<RejectRiskAssessmentCommand, RejectRiskAssessmentResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public RejectRiskAssessmentCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<RejectRiskAssessmentResult> Handle(RejectRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null) throw new InvalidOperationException("Assessment not found");

        assessment.RejectAssessment(request.RejectedBy, request.Reason);
        await _repository.SaveChangesAsync(cancellationToken);
        return new RejectRiskAssessmentResult(true);
    }
}
