using DocumentService.Domain.Aggregates;

namespace DocumentService.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}

public record DocumentUploadedEvent(
    Guid DocumentId,
    Guid CaseId,
    DocumentType Type,
    string FileName,
    DateTime UploadedAt
) : DomainEvent;

public record DocumentVirusScannedEvent(
    Guid DocumentId,
    Guid CaseId,
    bool IsClean,
    DateTime ScannedAt
) : DomainEvent;

public record DocumentVerifiedEvent(
    Guid DocumentId,
    Guid CaseId,
    DocumentType Type,
    string VerifiedBy,
    DateTime VerifiedAt
) : DomainEvent;

public record DocumentRejectedEvent(
    Guid DocumentId,
    Guid CaseId,
    string Reason,
    DateTime RejectedAt
) : DomainEvent;

