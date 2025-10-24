using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Presentation.Models;

public record EntityTypeDto(
    Guid Id,
    string Code,
    string DisplayName,
    string Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<EntityTypeRequirementDto>? Requirements
)
{
    public static EntityTypeDto FromDomain(EntityType entityType)
    {
        return new EntityTypeDto(
            entityType.Id,
            entityType.Code,
            entityType.DisplayName,
            entityType.Description,
            entityType.IsActive,
            entityType.CreatedAt,
            entityType.UpdatedAt,
            entityType.Requirements?.Select(EntityTypeRequirementDto.FromDomain).ToList()
        );
    }
}

public record EntityTypeRequirementDto(
    Guid Id,
    Guid RequirementId,
    bool IsRequired,
    int DisplayOrder,
    RequirementDto? Requirement
)
{
    public static EntityTypeRequirementDto FromDomain(EntityTypeRequirement etr)
    {
        return new EntityTypeRequirementDto(
            etr.Id,
            etr.RequirementId,
            etr.IsRequired,
            etr.DisplayOrder,
            etr.Requirement != null ? RequirementDto.FromDomain(etr.Requirement) : null
        );
    }
}

public record CreateEntityTypeRequest(
    string Code,
    string DisplayName,
    string Description
);

public record AddRequirementRequest(
    Guid RequirementId,
    bool IsRequired,
    int DisplayOrder
);
