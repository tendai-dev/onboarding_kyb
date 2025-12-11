namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a country-specific configuration profile that allows business teams
/// to define and manage all country-level overrides without engineering involvement.
/// </summary>
public class CountryProfile
{
    public Guid Id { get; private set; }
    public string CountryCode { get; private set; } // ISO 3166-1 alpha-2 or alpha-3 (e.g., "ZM", "ZW", "GB", "ZA")
    public string CountryName { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string CreatedBy { get; private set; }
    public string? UpdatedBy { get; private set; }

    // Navigation properties
    private readonly List<CountryEntityTypeOverride> _entityTypeOverrides = new();
    public IReadOnlyCollection<CountryEntityTypeOverride> EntityTypeOverrides => _entityTypeOverrides.AsReadOnly();

    private readonly List<CountryTerminologyOverride> _terminologyOverrides = new();
    public IReadOnlyCollection<CountryTerminologyOverride> TerminologyOverrides => _terminologyOverrides.AsReadOnly();

    private readonly List<CountryFormBundle> _formBundles = new();
    public IReadOnlyCollection<CountryFormBundle> FormBundles => _formBundles.AsReadOnly();

    private readonly List<CountryFieldVisibilityRule> _fieldVisibilityRules = new();
    public IReadOnlyCollection<CountryFieldVisibilityRule> FieldVisibilityRules => _fieldVisibilityRules.AsReadOnly();

    private readonly List<CountryComplianceToggle> _complianceToggles = new();
    public IReadOnlyCollection<CountryComplianceToggle> ComplianceToggles => _complianceToggles.AsReadOnly();

    private readonly List<ConfigurationTag> _tags = new();
    public IReadOnlyCollection<ConfigurationTag> Tags => _tags.AsReadOnly();

    private CountryProfile() { } // EF Core

    public CountryProfile(
        string countryCode,
        string countryName,
        string? description = null,
        string createdBy = "system")
    {
        Id = Guid.NewGuid();
        CountryCode = countryCode ?? throw new ArgumentNullException(nameof(countryCode));
        CountryName = countryName ?? throw new ArgumentNullException(nameof(countryName));
        Description = description;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        CreatedBy = createdBy ?? throw new ArgumentNullException(nameof(createdBy));
    }

    public void UpdateDetails(string countryName, string? description = null, string? updatedBy = null)
    {
        CountryName = countryName ?? throw new ArgumentNullException(nameof(countryName));
        Description = description;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
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

    public void AddTag(string tagName, string? tagValue = null)
    {
        if (_tags.Any(t => t.TagName == tagName && t.TagValue == tagValue))
            return; // Tag already exists

        var tag = new ConfigurationTag(Id, tagName, tagValue);
        _tags.Add(tag);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveTag(string tagName, string? tagValue = null)
    {
        var tag = _tags.FirstOrDefault(t => t.TagName == tagName && t.TagValue == tagValue);
        if (tag != null)
        {
            _tags.Remove(tag);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddEntityTypeOverride(CountryEntityTypeOverride overrideConfig)
    {
        if (_entityTypeOverrides.Any(o => o.EntityTypeId == overrideConfig.EntityTypeId))
            throw new InvalidOperationException($"Entity type override for EntityTypeId {overrideConfig.EntityTypeId} already exists");

        _entityTypeOverrides.Add(overrideConfig);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveEntityTypeOverride(Guid entityTypeId)
    {
        var overrideConfig = _entityTypeOverrides.FirstOrDefault(o => o.EntityTypeId == entityTypeId);
        if (overrideConfig != null)
        {
            _entityTypeOverrides.Remove(overrideConfig);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddTerminologyOverride(CountryTerminologyOverride overrideConfig)
    {
        _terminologyOverrides.Add(overrideConfig);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveTerminologyOverride(Guid overrideId)
    {
        var overrideConfig = _terminologyOverrides.FirstOrDefault(o => o.Id == overrideId);
        if (overrideConfig != null)
        {
            _terminologyOverrides.Remove(overrideConfig);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddFormBundle(CountryFormBundle bundle)
    {
        _formBundles.Add(bundle);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveFormBundle(Guid bundleId)
    {
        var bundle = _formBundles.FirstOrDefault(b => b.Id == bundleId);
        if (bundle != null)
        {
            _formBundles.Remove(bundle);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddFieldVisibilityRule(CountryFieldVisibilityRule rule)
    {
        _fieldVisibilityRules.Add(rule);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveFieldVisibilityRule(Guid ruleId)
    {
        var rule = _fieldVisibilityRules.FirstOrDefault(r => r.Id == ruleId);
        if (rule != null)
        {
            _fieldVisibilityRules.Remove(rule);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AddComplianceToggle(CountryComplianceToggle toggle)
    {
        if (_complianceToggles.Any(t => t.ComplianceCode == toggle.ComplianceCode))
            throw new InvalidOperationException($"Compliance toggle for code {toggle.ComplianceCode} already exists");

        _complianceToggles.Add(toggle);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveComplianceToggle(string complianceCode)
    {
        var toggle = _complianceToggles.FirstOrDefault(t => t.ComplianceCode == complianceCode);
        if (toggle != null)
        {
            _complianceToggles.Remove(toggle);
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

