namespace OnboardingApi.Domain.Risk.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record RiskAssessmentCreatedEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record RiskFactorAddedEvent(
    Guid AssessmentId,
    string CaseId,
    Guid FactorId,
    string FactorType,
    string RiskLevel,
    decimal Score
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record RiskFactorUpdatedEvent(
    Guid AssessmentId,
    string CaseId,
    Guid FactorId,
    string RiskLevel,
    decimal Score
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record RiskAssessmentCompletedEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string RiskLevel,
    decimal RiskScore,
    string AssessedBy
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record RiskAssessmentRejectedEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string RejectedBy,
    string Reason
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public record RiskLevelManuallySetEvent(
    Guid AssessmentId,
    string CaseId,
    string PartnerId,
    string PreviousLevel,
    string NewLevel,
    string AssessedBy,
    string Justification
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

