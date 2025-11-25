using MediatR;
using OnboardingApi.Domain.Risk.ValueObjects;

namespace OnboardingApi.Application.Risk.Commands;

public record CreateRiskAssessmentCommand(
    string CaseId,
    string PartnerId) : IRequest<CreateRiskAssessmentResult>;

public record CreateRiskAssessmentResult(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string Status);

public record AddRiskFactorCommand(
    Guid AssessmentId,
    RiskFactorType Type,
    RiskLevel Level,
    decimal Score,
    string Description,
    string? Source) : IRequest<AddRiskFactorResult>;

public record AddRiskFactorResult(
    Guid FactorId,
    string Type,
    string Level,
    decimal Score);

public record UpdateRiskFactorCommand(
    Guid AssessmentId,
    Guid FactorId,
    RiskLevel Level,
    decimal Score,
    string Description) : IRequest<UpdateRiskFactorResult>;

public record UpdateRiskFactorResult(
    Guid FactorId,
    string Level,
    decimal Score);

public record CompleteRiskAssessmentCommand(
    Guid AssessmentId,
    string AssessedBy,
    string? Notes) : IRequest<CompleteRiskAssessmentResult>;

public record CompleteRiskAssessmentResult(
    Guid AssessmentId,
    string Status,
    DateTime CompletedAt);

public record RejectRiskAssessmentCommand(
    Guid AssessmentId,
    string RejectedBy,
    string Reason) : IRequest<RejectRiskAssessmentResult>;

public record RejectRiskAssessmentResult(
    Guid AssessmentId,
    string Status);

public record SetManualRiskLevelCommand(
    Guid AssessmentId,
    RiskLevel RiskLevel,
    string AssessedBy,
    string Justification) : IRequest<SetManualRiskLevelResult>;

public record SetManualRiskLevelResult(
    Guid AssessmentId,
    string RiskLevel,
    decimal RiskScore);

public record UpdateRiskAssessmentNotesCommand(
    Guid AssessmentId,
    string? Notes) : IRequest<UpdateRiskAssessmentNotesResult>;

public record UpdateRiskAssessmentNotesResult(
    Guid AssessmentId,
    bool Success);

