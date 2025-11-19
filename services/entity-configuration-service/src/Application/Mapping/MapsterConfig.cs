using Mapster;
using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Mapping;

/// <summary>
/// Mapster configuration for entity configuration service
/// Provides type-safe mapping between domain aggregates and DTOs
/// Note: DTO mappings are configured in Presentation layer where DTOs are defined
/// </summary>
public static class MapsterConfig
{
    /// <summary>
    /// Configures Mapster type adapters for domain to DTO mappings
    /// Basic domain mappings are configured here, DTO-specific mappings are in Presentation layer
    /// </summary>
    public static void Configure()
    {
        // Basic domain model mappings can be configured here
        // DTO mappings are handled in Presentation layer where DTOs are accessible
        // This allows Mapster to be used throughout the application
        
        // Compile configurations for better performance
        TypeAdapterConfig.GlobalSettings.Compile();
    }
}

