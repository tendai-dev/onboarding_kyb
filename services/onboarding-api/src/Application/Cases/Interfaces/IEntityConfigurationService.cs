namespace OnboardingApi.Application.Cases.Interfaces;

/// <summary>
/// Interface for entity configuration service - defined in Application layer
/// to avoid circular dependency with Infrastructure
/// </summary>
public interface IEntityConfigurationService
{
    Task<EntityTypeConfiguration?> GetEntityTypeConfigurationAsync(string entityTypeCode, CancellationToken cancellationToken = default);
    Task<EntityTypeConfiguration?> GetEntityTypeConfigurationByIdAsync(string formConfigId, string? version = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Entity type configuration DTO for Application layer
/// </summary>
public class EntityTypeConfiguration
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<EntityRequirement> Requirements { get; set; } = new();
}

public class EntityRequirement
{
    public string? FieldPath { get; set; }
    public bool IsRequired { get; set; }
    public string? ValidationRule { get; set; }
}
