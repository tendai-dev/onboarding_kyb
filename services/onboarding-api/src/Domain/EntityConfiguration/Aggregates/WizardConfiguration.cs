namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a wizard configuration for an entity type with multiple steps
/// </summary>
public class WizardConfiguration
{
    public Guid Id { get; private set; }
    public Guid EntityTypeId { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    
    // Navigation property
    private readonly List<WizardStep> _steps = new();
    public IReadOnlyCollection<WizardStep> Steps => _steps.AsReadOnly();

    private WizardConfiguration() { } // EF Core

    public WizardConfiguration(Guid entityTypeId)
    {
        Id = Guid.NewGuid();
        EntityTypeId = entityTypeId;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateSteps(List<WizardStep> steps)
    {
        _steps.Clear();
        foreach (var step in steps)
        {
            _steps.Add(step);
        }
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

/// <summary>
/// Represents a step in a wizard configuration
/// </summary>
public class WizardStep
{
    public Guid Id { get; private set; }
    public Guid WizardConfigurationId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Subtitle { get; private set; } = string.Empty;
    public string RequirementTypes { get; private set; } = string.Empty; // JSON array of requirement type strings
    public string ChecklistCategory { get; private set; } = string.Empty;
    public int StepNumber { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private WizardStep() { } // EF Core

    public WizardStep(
        Guid wizardConfigurationId,
        string title,
        string subtitle,
        string requirementTypes,
        string checklistCategory,
        int stepNumber)
    {
        Id = Guid.NewGuid();
        WizardConfigurationId = wizardConfigurationId;
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Subtitle = subtitle ?? throw new ArgumentNullException(nameof(subtitle));
        RequirementTypes = requirementTypes ?? "[]";
        ChecklistCategory = checklistCategory ?? string.Empty;
        StepNumber = stepNumber;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string title,
        string subtitle,
        string requirementTypes,
        string checklistCategory,
        int stepNumber)
    {
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Subtitle = subtitle ?? throw new ArgumentNullException(nameof(subtitle));
        RequirementTypes = requirementTypes ?? "[]";
        ChecklistCategory = checklistCategory ?? string.Empty;
        StepNumber = stepNumber;
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

