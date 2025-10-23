namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// Represents a KYC requirement field or document that can be collected
/// Based on Annexure A requirements
/// </summary>
public class Requirement
{
    public Guid Id { get; private set; }
    public string Code { get; private set; } // e.g., "LEGAL_NAME", "REGISTRATION_NUMBER", "ID_PASSPORT"
    public string DisplayName { get; private set; } // e.g., "Registered or Full Legal Name"
    public string Description { get; private set; }
    public RequirementType Type { get; private set; } // Information, Document, Proof of Identity, etc.
    public FieldType FieldType { get; private set; } // Text, Date, File, etc.
    public string? ValidationRules { get; private set; } // JSON string with validation rules
    public string? HelpText { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property
    private readonly List<RequirementOption> _options = new();
    public IReadOnlyCollection<RequirementOption> Options => _options.AsReadOnly();

    private Requirement() { } // EF Core

    public Requirement(
        string code,
        string displayName,
        string description,
        RequirementType type,
        FieldType fieldType,
        string? validationRules = null,
        string? helpText = null)
    {
        Id = Guid.NewGuid();
        Code = code ?? throw new ArgumentNullException(nameof(code));
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Type = type;
        FieldType = fieldType;
        ValidationRules = validationRules;
        HelpText = helpText;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string displayName,
        string description,
        string? validationRules,
        string? helpText)
    {
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description ?? throw new ArgumentNullException(nameof(description));
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

    public void AddOption(string value, string displayText, int displayOrder)
    {
        var option = new RequirementOption(Id, value, displayText, displayOrder);
        _options.Add(option);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveOption(Guid optionId)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId);
        if (option != null)
        {
            _options.Remove(option);
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

/// <summary>
/// Options for dropdown/select requirements
/// </summary>
public class RequirementOption
{
    public Guid Id { get; private set; }
    public Guid RequirementId { get; private set; }
    public string Value { get; private set; }
    public string DisplayText { get; private set; }
    public int DisplayOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation property
    public Requirement Requirement { get; private set; } = null!;

    private RequirementOption() { } // EF Core

    public RequirementOption(
        Guid requirementId,
        string value,
        string displayText,
        int displayOrder)
    {
        Id = Guid.NewGuid();
        RequirementId = requirementId;
        Value = value ?? throw new ArgumentNullException(nameof(value));
        DisplayText = displayText ?? throw new ArgumentNullException(nameof(displayText));
        DisplayOrder = displayOrder;
        CreatedAt = DateTime.UtcNow;
    }
}

public enum RequirementType
{
    Information = 1,        // Basic information fields
    Document = 2,          // Document uploads
    ProofOfIdentity = 3,   // ID/Passport documents
    ProofOfAddress = 4,    // Address verification documents
    OwnershipStructure = 5, // Ownership diagrams, shareholder info
    BoardDirectors = 6,    // Board of Directors information
    AuthorizedSignatories = 7 // Authorized person documents
}

public enum FieldType
{
    Text = 1,              // Single line text
    TextArea = 2,          // Multi-line text
    Email = 3,             // Email field
    Phone = 4,             // Phone number
    Date = 5,              // Date picker
    Number = 6,            // Numeric input
    Select = 7,            // Dropdown selection
    MultiSelect = 8,       // Multiple selection
    File = 9,              // File upload
    Boolean = 10,          // Yes/No checkbox
    Country = 11,          // Country selector
    Address = 12           // Address compound field
}


