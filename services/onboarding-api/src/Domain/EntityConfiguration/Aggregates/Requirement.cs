namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a requirement that can be associated with entity types
/// </summary>
public class Requirement
{
    public Guid Id { get; private set; }
    public string Code { get; private set; } // e.g., "REGISTERED_LEGAL_NAME", "CERTIFICATE_INCORPORATION"
    public string DisplayName { get; private set; } // e.g., "Registered / Legal Name"
    public string Description { get; private set; }
    public string Type { get; private set; } // e.g., "INFORMATION", "DOCUMENTATION"
    public string FieldType { get; private set; } // e.g., "text", "date", "file", "number", "email"
    public string? ValidationRules { get; private set; } // JSON string for validation rules
    public string? HelpText { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Requirement() { } // EF Core

    public Requirement(
        string code,
        string displayName,
        string description,
        string type,
        string fieldType,
        string? validationRules = null,
        string? helpText = null)
    {
        Id = Guid.NewGuid();
        Code = code ?? throw new ArgumentNullException(nameof(code));
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Type = type ?? throw new ArgumentNullException(nameof(type));
        FieldType = fieldType ?? throw new ArgumentNullException(nameof(fieldType));
        ValidationRules = validationRules;
        HelpText = helpText;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string displayName,
        string description,
        string type,
        string fieldType,
        string? validationRules = null,
        string? helpText = null)
    {
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Type = type ?? throw new ArgumentNullException(nameof(type));
        FieldType = fieldType ?? throw new ArgumentNullException(nameof(fieldType));
        ValidationRules = validationRules;
        HelpText = helpText;
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

