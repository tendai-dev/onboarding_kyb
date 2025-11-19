using MediatR;

namespace RiskService.Domain.Events;

public record RiskAssessmentCreatedEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId) : INotification;

public record RiskAssessmentCompletedEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string RiskLevel,
    decimal RiskScore,
    string AssessedBy) : INotification;

public record RiskAssessmentRejectedEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string RejectedBy,
    string Reason) : INotification;

public record RiskFactorAddedEvent(
    Guid AssessmentId,
    string CaseId,
    Guid FactorId,
    string FactorType,
    string RiskLevel,
    decimal Score) : INotification;

public record RiskFactorUpdatedEvent(
    Guid AssessmentId,
    string CaseId,
    Guid FactorId,
    string RiskLevel,
    decimal Score) : INotification;

public record RiskLevelManuallySetEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string PreviousRiskLevel,
    string NewRiskLevel,
    string AssessedBy,
    string Justification) : INotification;
