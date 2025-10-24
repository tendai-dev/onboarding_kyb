using EntityConfigurationService.Domain.Events;
using EntityConfigurationService.Domain.ValueObjects;

namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// Form Configuration Aggregate Root
/// Defines dynamic form schemas that render based on entity type, country, and risk level
/// </summary>
public class FormConfiguration
{
    private readonly List<IDomainEvent> _domainEvents = new();
    
    public Guid Id { get; private set; }
    public string FormCode { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int Version { get; private set; }
    public bool IsActive { get; private set; }
    
    // Applicable contexts
    public List<string> ApplicableEntityTypes { get; private set; } = new();
    public List<string> ApplicableCountries { get; private set; } = new();
    public List<string> ApplicableRiskLevels { get; private set; } = new();
    
    // Form structure
    private List<FormSection> _sections = new();
    public IReadOnlyCollection<FormSection> Sections => _sections.AsReadOnly();
    
    // External data sources
    private List<ExternalDataSource> _dataSources = new();
    public IReadOnlyCollection<ExternalDataSource> DataSources => _dataSources.AsReadOnly();
    
    // Metadata
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public DateTime? UpdatedAt { get; private set; }
    public string? UpdatedBy { get; private set; }
    
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    private FormConfiguration() { }
    
    public static FormConfiguration Create(
        string formCode,
        string displayName,
        string description,
        List<string> applicableEntityTypes,
        string createdBy)
    {
        var form = new FormConfiguration
        {
            Id = Guid.NewGuid(),
            FormCode = formCode,
            DisplayName = displayName,
            Description = description,
            Version = 1,
            IsActive = true,
            ApplicableEntityTypes = applicableEntityTypes,
            ApplicableCountries = new() { "*" }, // Default: all countries
            ApplicableRiskLevels = new() { "*" }, // Default: all risk levels
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            _sections = new(),
            _dataSources = new()
        };
        
        form.AddDomainEvent(new FormConfigurationCreatedEvent(
            form.Id,
            form.FormCode,
            form.DisplayName,
            DateTime.UtcNow
        ));
        
        return form;
    }
    
    public void AddSection(FormSection section)
    {
        if (_sections.Any(s => s.SectionCode == section.SectionCode))
            throw new InvalidOperationException($"Section with code '{section.SectionCode}' already exists");
        
        _sections.Add(section);
        
        AddDomainEvent(new FormSectionAddedEvent(
            Id,
            section.SectionCode,
            DateTime.UtcNow
        ));
    }
    
    public void UpdateSection(string sectionCode, FormSection updatedSection)
    {
        var index = _sections.FindIndex(s => s.SectionCode == sectionCode);
        if (index == -1)
            throw new InvalidOperationException($"Section '{sectionCode}' not found");
        
        _sections[index] = updatedSection;
        UpdatedAt = DateTime.UtcNow;
    }
    
    public void RemoveSection(string sectionCode)
    {
        var section = _sections.FirstOrDefault(s => s.SectionCode == sectionCode);
        if (section == null)
            throw new InvalidOperationException($"Section '{sectionCode}' not found");
        
        _sections.Remove(section);
        UpdatedAt = DateTime.UtcNow;
    }
    
    public void AddDataSource(ExternalDataSource dataSource)
    {
        if (_dataSources.Any(d => d.SourceCode == dataSource.SourceCode))
            throw new InvalidOperationException($"Data source '{dataSource.SourceCode}' already exists");
        
        _dataSources.Add(dataSource);
    }
    
    public void SetApplicableCountries(List<string> countries)
    {
        ApplicableCountries = countries ?? new() { "*" };
        UpdatedAt = DateTime.UtcNow;
    }
    
    public void SetApplicableRiskLevels(List<string> riskLevels)
    {
        ApplicableRiskLevels = riskLevels ?? new() { "*" };
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
    
    public void IncrementVersion(string updatedBy)
    {
        Version++;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        
        AddDomainEvent(new FormConfigurationUpdatedEvent(
            Id,
            Version,
            DateTime.UtcNow
        ));
    }
    
    public bool IsApplicableFor(string entityType, string country, string riskLevel)
    {
        if (!IsActive) return false;
        
        var entityMatch = ApplicableEntityTypes.Contains("*") || ApplicableEntityTypes.Contains(entityType);
        var countryMatch = ApplicableCountries.Contains("*") || ApplicableCountries.Contains(country);
        var riskMatch = ApplicableRiskLevels.Contains("*") || ApplicableRiskLevels.Contains(riskLevel);
        
        return entityMatch && countryMatch && riskMatch;
    }
    
    public void ClearDomainEvents() => _domainEvents.Clear();
    
    private void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
}

/// <summary>
/// Represents a section of a form with conditional visibility
/// </summary>
public class FormSection
{
    public string SectionCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    
    // Conditional rendering
    public VisibilityRule? VisibilityRule { get; set; }
    
    // Fields in this section
    public List<FormField> Fields { get; set; } = new();
}

/// <summary>
/// Individual form field with validation and data binding
/// </summary>
public class FormField
{
    public string FieldCode { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Placeholder { get; set; }
    public string? HelpText { get; set; }
    public FieldType Type { get; set; }
    public int Order { get; set; }
    
    // Validation
    public bool IsRequired { get; set; }
    public RequirementRule? RequirementRule { get; set; }
    public List<ValidationRule> ValidationRules { get; set; } = new();
    
    // Data binding
    public string? DataSourceCode { get; set; }
    public string? DataPath { get; set; }
    
    // Conditional rendering
    public VisibilityRule? VisibilityRule { get; set; }
    
    // Options for select/radio fields
    public List<FieldOption> Options { get; set; } = new();
}

/// <summary>
/// Defines when a field or section should be visible
/// </summary>
public class VisibilityRule
{
    public string Condition { get; set; } = string.Empty; // e.g., "riskLevel == 'HIGH'"
    public List<FieldCondition> FieldConditions { get; set; } = new();
}

/// <summary>
/// Condition based on other field values
/// </summary>
public class FieldCondition
{
    public string FieldCode { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty; // ==, !=, contains, etc.
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// Defines when a field becomes required
/// </summary>
public class RequirementRule
{
    public string Condition { get; set; } = string.Empty;
    public List<FieldCondition> FieldConditions { get; set; } = new();
}

/// <summary>
/// Validation rule for field values
/// </summary>
public class ValidationRule
{
    public string Type { get; set; } = string.Empty; // email, phone, regex, minLength, etc.
    public string? Parameter { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}

/// <summary>
/// Option for select/radio/checkbox fields
/// </summary>
public class FieldOption
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

/// <summary>
/// External data source configuration (e.g., Companies House API)
/// </summary>
public class ExternalDataSource
{
    public string SourceCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ApiEndpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public DataSourceType Type { get; set; }
    public List<DataMapping> Mappings { get; set; } = new();
}

/// <summary>
/// Maps external API response to form fields
/// </summary>
public class DataMapping
{
    public string SourcePath { get; set; } = string.Empty; // JSON path in API response
    public string TargetFieldCode { get; set; } = string.Empty; // Form field to populate
    public string? Transformation { get; set; } // Optional transformation function
}

public enum FieldType
{
    Text,
    Email,
    Phone,
    Number,
    Date,
    Select,
    MultiSelect,
    Radio,
    Checkbox,
    Textarea,
    File,
    Country,
    Currency,
    Address
}

public enum DataSourceType
{
    REST,
    GraphQL,
    SOAP
}

// Domain Events
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

public record FormConfigurationCreatedEvent(
    Guid FormId,
    string FormCode,
    string DisplayName,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record FormSectionAddedEvent(
    Guid FormId,
    string SectionCode,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

public record FormConfigurationUpdatedEvent(
    Guid FormId,
    int NewVersion,
    DateTime OccurredAt
) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}

