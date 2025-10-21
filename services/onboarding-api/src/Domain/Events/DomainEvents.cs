using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Domain.Events;

/// <summary>
/// Base interface for all domain events
/// </summary>
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

/// <summary>
/// Base domain event
/// </summary>
public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a new onboarding case is created
/// </summary>
public record OnboardingCaseCreatedEvent(
    Guid CaseId,
    string CaseNumber,
    OnboardingType Type,
    Guid PartnerId,
    string PartnerReferenceId,
    DateTime CreatedAt
) : DomainEvent;

/// <summary>
/// Event raised when an onboarding case is submitted
/// </summary>
public record OnboardingCaseSubmittedEvent(
    Guid CaseId,
    string CaseNumber,
    OnboardingType Type,
    Guid PartnerId,
    DateTime SubmittedAt
) : DomainEvent;

/// <summary>
/// Event raised when an onboarding case is updated
/// </summary>
public record OnboardingCaseUpdatedEvent(
    Guid CaseId,
    string CaseNumber,
    string UpdatedField,
    DateTime UpdatedAt
) : DomainEvent;

/// <summary>
/// Event raised when an onboarding case is approved
/// </summary>
public record OnboardingCaseApprovedEvent(
    Guid CaseId,
    string CaseNumber,
    Guid PartnerId,
    string ApprovedBy,
    DateTime ApprovedAt
) : DomainEvent;

/// <summary>
/// Event raised when an onboarding case is rejected
/// </summary>
public record OnboardingCaseRejectedEvent(
    Guid CaseId,
    string CaseNumber,
    Guid PartnerId,
    string Reason,
    DateTime RejectedAt
) : DomainEvent;

/// <summary>
/// Event raised when additional information is requested
/// </summary>
public record AdditionalInfoRequestedEvent(
    Guid CaseId,
    string CaseNumber,
    string Message,
    DateTime RequestedAt
) : DomainEvent;

