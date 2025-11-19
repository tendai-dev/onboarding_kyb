namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// Represents a wizard configuration that defines the steps and flow for an entity type application
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

    // Navigation to EntityType
    public EntityType? EntityType { get; private set; }

    private WizardConfiguration() { } // EF Core

    public WizardConfiguration(Guid entityTypeId)
    {
        Id = Guid.NewGuid();
        EntityTypeId = entityTypeId;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
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

    public void AddStep(WizardStep step)
    {
        if (step == null)
            throw new ArgumentNullException(nameof(step));

        _steps.Add(step);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveStep(Guid stepId)
    {
        var step = _steps.FirstOrDefault(s => s.Id == stepId);
        if (step != null)
        {
            _steps.Remove(step);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void UpdateStep(Guid stepId, string title, string subtitle, List<string> requirementTypes, string checklistCategory, int stepNumber, bool isActive)
    {
        var step = _steps.FirstOrDefault(s => s.Id == stepId);
        if (step == null)
            throw new InvalidOperationException($"Step with ID '{stepId}' not found");

        step.Update(title, subtitle, requirementTypes, checklistCategory, stepNumber, isActive);
        UpdatedAt = DateTime.UtcNow;
    }

    public void ReplaceSteps(IEnumerable<WizardStep> newSteps)
    {
        _steps.Clear();
        foreach (var step in newSteps)
        {
            _steps.Add(step);
        }
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Represents a single step in the wizard configuration
/// </summary>
public class WizardStep
{
    public Guid Id { get; private set; }
    public Guid WizardConfigurationId { get; private set; }
    public string Title { get; private set; }
    public string Subtitle { get; private set; }
    public string ChecklistCategory { get; private set; }
    public int StepNumber { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property
    private readonly List<WizardStepRequirementType> _requirementTypes = new();
    public IReadOnlyCollection<WizardStepRequirementType> RequirementTypes => _requirementTypes.AsReadOnly();

    public WizardConfiguration? WizardConfiguration { get; private set; }

    private WizardStep() { } // EF Core

    public WizardStep(
        Guid wizardConfigurationId,
        string title,
        string subtitle,
        List<string> requirementTypes,
        string checklistCategory,
        int stepNumber,
        bool isActive = true)
    {
        Id = Guid.NewGuid();
        WizardConfigurationId = wizardConfigurationId;
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Subtitle = subtitle ?? throw new ArgumentNullException(nameof(subtitle));
        ChecklistCategory = checklistCategory ?? throw new ArgumentNullException(nameof(checklistCategory));
        StepNumber = stepNumber;
        IsActive = isActive;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;

        if (requirementTypes != null)
        {
            foreach (var reqType in requirementTypes)
            {
                _requirementTypes.Add(new WizardStepRequirementType(Id, reqType));
            }
        }
    }

    public void Update(string title, string subtitle, List<string> requirementTypes, string checklistCategory, int stepNumber, bool isActive)
    {
        Title = title ?? throw new ArgumentNullException(nameof(title));
        Subtitle = subtitle ?? throw new ArgumentNullException(nameof(subtitle));
        ChecklistCategory = checklistCategory ?? throw new ArgumentNullException(nameof(checklistCategory));
        StepNumber = stepNumber;
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;

        // Update requirement types
        _requirementTypes.Clear();
        if (requirementTypes != null)
        {
            foreach (var reqType in requirementTypes)
            {
                _requirementTypes.Add(new WizardStepRequirementType(Id, reqType));
            }
        }
    }
}

/// <summary>
/// Join entity linking WizardStep to RequirementType
/// </summary>
public class WizardStepRequirementType
{
    public Guid Id { get; private set; }
    public Guid WizardStepId { get; private set; }
    public string RequirementType { get; private set; } // e.g., "Information", "ProofOfIdentity"

    public WizardStep? WizardStep { get; private set; }

    private WizardStepRequirementType() { } // EF Core

    public WizardStepRequirementType(Guid wizardStepId, string requirementType)
    {
        Id = Guid.NewGuid();
        WizardStepId = wizardStepId;
        RequirementType = requirementType ?? throw new ArgumentNullException(nameof(requirementType));
    }
}

