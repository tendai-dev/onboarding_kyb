namespace EntityConfigurationService.Domain.Events;

public abstract record DomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}

// Entity Type Events
public record EntityTypeCreated(
    Guid EntityTypeId,
    string Code,
    string DisplayName
) : DomainEvent;

public record EntityTypeUpdated(
    Guid EntityTypeId,
    string DisplayName,
    string Description
) : DomainEvent;

public record EntityTypeActivated(Guid EntityTypeId) : DomainEvent;
public record EntityTypeDeactivated(Guid EntityTypeId) : DomainEvent;

public record RequirementAddedToEntityType(
    Guid EntityTypeId,
    Guid RequirementId,
    bool IsRequired
) : DomainEvent;

public record RequirementRemovedFromEntityType(
    Guid EntityTypeId,
    Guid RequirementId
) : DomainEvent;

// Requirement Events
public record RequirementCreated(
    Guid RequirementId,
    string Code,
    string DisplayName,
    string Type
) : DomainEvent;

public record RequirementUpdated(
    Guid RequirementId,
    string DisplayName,
    string Description
) : DomainEvent;

public record RequirementActivated(Guid RequirementId) : DomainEvent;
public record RequirementDeactivated(Guid RequirementId) : DomainEvent;


