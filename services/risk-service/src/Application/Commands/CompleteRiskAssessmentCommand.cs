using MediatR;

namespace RiskService.Application.Commands;

public record CompleteRiskAssessmentCommand(
    Guid AssessmentId,
    string AssessedBy,
    string? Notes = null) : IRequest<CompleteRiskAssessmentResult>;

public record CompleteRiskAssessmentResult(
    Guid AssessmentId,
    string CaseId,
    string RiskLevel,
    decimal RiskScore,
    DateTime CompletedAt);
