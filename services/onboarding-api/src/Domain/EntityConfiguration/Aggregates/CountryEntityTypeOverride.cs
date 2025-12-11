namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents country-specific overrides for entity types.
/// Allows enabling/disabling entity types per country and customizing their display.
/// </summary>
public class CountryEntityTypeOverride
{
    public Guid Id { get; private set; }
    public Guid CountryProfileId { get; private set; }
    public Guid EntityTypeId { get; private set; }
    public bool IsEnabled { get; private set; }
    public string? CustomDisplayName { get; private set; }
    public string? CustomDescription { get; private set; }
    public int DisplayOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CountryEntityTypeOverride() { } // EF Core

    public CountryEntityTypeOverride(
        Guid countryProfileId,
        Guid entityTypeId,
        bool isEnabled = true,
        string? customDisplayName = null,
        string? customDescription = null,
        int displayOrder = 0)
    {
        Id = Guid.NewGuid();
        CountryProfileId = countryProfileId;
        EntityTypeId = entityTypeId;
        IsEnabled = isEnabled;
        CustomDisplayName = customDisplayName;
        CustomDescription = customDescription;
        DisplayOrder = displayOrder;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        bool isEnabled,
        string? customDisplayName = null,
        string? customDescription = null,
        int displayOrder = 0)
    {
        IsEnabled = isEnabled;
        CustomDisplayName = customDisplayName;
        CustomDescription = customDescription;
        DisplayOrder = displayOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}

