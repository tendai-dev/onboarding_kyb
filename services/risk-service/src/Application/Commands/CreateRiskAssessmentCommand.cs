using MediatR;

namespace RiskService.Application.Commands;

public record CreateRiskAssessmentCommand(
    string CaseId,
    string PartnerId) : IRequest<CreateRiskAssessmentResult>;

public record CreateRiskAssessmentResult(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string Status);
