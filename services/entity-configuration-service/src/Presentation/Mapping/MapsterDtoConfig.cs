using Mapster;
using EntityConfigurationService.Domain.Aggregates;
using EntityConfigurationService.Presentation.Models;

namespace EntityConfigurationService.Presentation.Mapping;

/// <summary>
/// Mapster configuration for DTO mappings in Presentation layer
/// Provides type-safe mapping between domain aggregates and DTOs
/// </summary>
public static class MapsterDtoConfig
{
    /// <summary>
    /// Configures Mapster type adapters for domain to DTO mappings
    /// </summary>
    public static void Configure()
    {
        // Configure Requirement to RequirementDto mapping
        TypeAdapterConfig<Requirement, RequirementDto>
            .NewConfig()
            .Map(dest => dest.Type, src => src.Type.ToString())
            .Map(dest => dest.FieldType, src => src.FieldType.ToString())
            .Map(dest => dest.Options, src => src.Options != null 
                ? src.Options.Select(o => o.Adapt<RequirementOptionDto>()).ToList() 
                : null)
            .Map(dest => dest, src => src);

        // Configure RequirementOption to RequirementOptionDto mapping
        TypeAdapterConfig<RequirementOption, RequirementOptionDto>
            .NewConfig()
            .Map(dest => dest, src => src);

        // Configure EntityType to EntityTypeDto mapping
        TypeAdapterConfig<EntityType, EntityTypeDto>
            .NewConfig()
            .Map(dest => dest.Requirements, src => src.Requirements != null
                ? src.Requirements.Select(r => r.Adapt<EntityTypeRequirementDto>()).ToList()
                : null)
            .Map(dest => dest, src => src);

        // Configure EntityTypeRequirement to EntityTypeRequirementDto mapping
        TypeAdapterConfig<EntityTypeRequirement, EntityTypeRequirementDto>
            .NewConfig()
            .Map(dest => dest.Requirement, src => src.Requirement != null
                ? src.Requirement.Adapt<RequirementDto>()
                : null)
            .Map(dest => dest, src => src);

        // Compile configurations for better performance
        TypeAdapterConfig.GlobalSettings.Compile();
    }
}

