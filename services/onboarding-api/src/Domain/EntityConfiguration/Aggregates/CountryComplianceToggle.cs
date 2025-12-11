namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a compliance toggle for country-specific compliance requirements.
/// Allows enabling/disabling specific compliance checks per country.
/// </summary>
public class CountryComplianceToggle
{
    public Guid Id { get; private set; }
    public Guid CountryProfileId { get; private set; }
    public string ComplianceCode { get; private set; } // e.g., "KYC_LEVEL_1", "AML_CHECK", "SANCTIONS_SCREENING"
    public string ComplianceName { get; private set; }
    public string? Description { get; private set; }
    public bool IsEnabled { get; private set; }
    public string? ConfigurationJson { get; private set; } // JSON for compliance-specific configuration
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CountryComplianceToggle() { } // EF Core

    public CountryComplianceToggle(
        Guid countryProfileId,
        string complianceCode,
        string complianceName,
        bool isEnabled = true,
        string? description = null,
        string? configurationJson = null)
    {
        Id = Guid.NewGuid();
        CountryProfileId = countryProfileId;
        ComplianceCode = complianceCode ?? throw new ArgumentNullException(nameof(complianceCode));
        ComplianceName = complianceName ?? throw new ArgumentNullException(nameof(complianceName));
        IsEnabled = isEnabled;
        Description = description;
        ConfigurationJson = configurationJson;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string complianceName,
        bool isEnabled,
        string? description = null,
        string? configurationJson = null)
    {
        ComplianceName = complianceName ?? throw new ArgumentNullException(nameof(complianceName));
        IsEnabled = isEnabled;
        Description = description;
        ConfigurationJson = configurationJson;
        UpdatedAt = DateTime.UtcNow;
    }
}

