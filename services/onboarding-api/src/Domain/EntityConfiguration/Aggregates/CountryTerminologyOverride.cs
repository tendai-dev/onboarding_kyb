namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents country-specific terminology variations for fields, labels, and help text.
/// Allows business teams to customize how fields are displayed in different countries.
/// </summary>
public class CountryTerminologyOverride
{
    public Guid Id { get; private set; }
    public Guid CountryProfileId { get; private set; }
    public string TargetType { get; private set; } // "REQUIREMENT", "ENTITY_TYPE", "FIELD", "STEP"
    public string TargetCode { get; private set; } // Code of the target (requirement code, entity type code, etc.)
    public string? OverrideDisplayName { get; private set; }
    public string? OverrideDescription { get; private set; }
    public string? OverrideHelpText { get; private set; }
    public string? OverridePlaceholder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CountryTerminologyOverride() { } // EF Core

    public CountryTerminologyOverride(
        Guid countryProfileId,
        string targetType,
        string targetCode,
        string? overrideDisplayName = null,
        string? overrideDescription = null,
        string? overrideHelpText = null,
        string? overridePlaceholder = null)
    {
        Id = Guid.NewGuid();
        CountryProfileId = countryProfileId;
        TargetType = targetType ?? throw new ArgumentNullException(nameof(targetType));
        TargetCode = targetCode ?? throw new ArgumentNullException(nameof(targetCode));
        OverrideDisplayName = overrideDisplayName;
        OverrideDescription = overrideDescription;
        OverrideHelpText = overrideHelpText;
        OverridePlaceholder = overridePlaceholder;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string? overrideDisplayName = null,
        string? overrideDescription = null,
        string? overrideHelpText = null,
        string? overridePlaceholder = null)
    {
        OverrideDisplayName = overrideDisplayName;
        OverrideDescription = overrideDescription;
        OverrideHelpText = overrideHelpText;
        OverridePlaceholder = overridePlaceholder;
        UpdatedAt = DateTime.UtcNow;
    }
}

