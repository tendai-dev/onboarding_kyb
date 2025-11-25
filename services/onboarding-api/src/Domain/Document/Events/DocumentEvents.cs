namespace OnboardingApi.Domain.Document.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record DocumentUploadedEvent(
    Guid DocumentId,
    Guid CaseId,
    string DocumentType,
    string FileName,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record DocumentVirusScannedEvent(
    Guid DocumentId,
    Guid CaseId,
    bool IsClean,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record DocumentVerifiedEvent(
    Guid DocumentId,
    Guid CaseId,
    string DocumentType,
    string VerifiedBy,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record DocumentRejectedEvent(
    Guid DocumentId,
    Guid CaseId,
    string Reason,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

