namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a form bundle configuration for a country, defining which fields
/// are included, their order, and country-specific field configurations.
/// </summary>
public class CountryFormBundle
{
    public Guid Id { get; private set; }
    public Guid CountryProfileId { get; private set; }
    public Guid? EntityTypeId { get; private set; } // Null means applies to all entity types
    public string BundleName { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public string FieldConfigurationJson { get; private set; } // JSON array of field configurations
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CountryFormBundle() { } // EF Core

    public CountryFormBundle(
        Guid countryProfileId,
        string bundleName,
        string fieldConfigurationJson,
        Guid? entityTypeId = null,
        string? description = null)
    {
        Id = Guid.NewGuid();
        CountryProfileId = countryProfileId;
        EntityTypeId = entityTypeId;
        BundleName = bundleName ?? throw new ArgumentNullException(nameof(bundleName));
        Description = description;
        FieldConfigurationJson = fieldConfigurationJson ?? throw new ArgumentNullException(nameof(fieldConfigurationJson));
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string bundleName,
        string fieldConfigurationJson,
        Guid? entityTypeId = null,
        string? description = null)
    {
        BundleName = bundleName ?? throw new ArgumentNullException(nameof(bundleName));
        FieldConfigurationJson = fieldConfigurationJson ?? throw new ArgumentNullException(nameof(fieldConfigurationJson));
        EntityTypeId = entityTypeId;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}

