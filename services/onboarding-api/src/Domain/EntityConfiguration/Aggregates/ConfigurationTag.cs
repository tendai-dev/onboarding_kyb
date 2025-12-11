namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a tag that can be used for rule-based configuration.
/// Tags enable flexible, rule-based matching without hardcoding country logic.
/// </summary>
public class ConfigurationTag
{
    public Guid Id { get; private set; }
    public Guid CountryProfileId { get; private set; }
    public string TagName { get; private set; } // e.g., "REGION", "REGULATORY_FRAMEWORK", "CURRENCY"
    public string? TagValue { get; private set; } // e.g., "AFRICA", "FATF", "USD"
    public DateTime CreatedAt { get; private set; }

    private ConfigurationTag() { } // EF Core

    public ConfigurationTag(
        Guid countryProfileId,
        string tagName,
        string? tagValue = null)
    {
        Id = Guid.NewGuid();
        CountryProfileId = countryProfileId;
        TagName = tagName ?? throw new ArgumentNullException(nameof(tagName));
        TagValue = tagValue;
        CreatedAt = DateTime.UtcNow;
    }
}

