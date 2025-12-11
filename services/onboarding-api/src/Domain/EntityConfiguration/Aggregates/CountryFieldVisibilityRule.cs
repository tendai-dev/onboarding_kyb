namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a rule that controls field visibility based on conditions.
/// Uses a rule-based engine to evaluate when fields should be shown or hidden.
/// </summary>
public class CountryFieldVisibilityRule
{
    public Guid Id { get; private set; }
    public Guid CountryProfileId { get; private set; }
    public string TargetFieldCode { get; private set; } // The field this rule applies to
    public Guid? EntityTypeId { get; private set; } // Optional: applies only to specific entity type
    public string RuleExpression { get; private set; } // JSON string representing the rule logic
    public bool IsVisible { get; private set; } // If true, show field when rule matches; if false, hide when rule matches
    public int Priority { get; private set; } // Higher priority rules are evaluated first
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CountryFieldVisibilityRule() { } // EF Core

    public CountryFieldVisibilityRule(
        Guid countryProfileId,
        string targetFieldCode,
        string ruleExpression,
        bool isVisible = true,
        Guid? entityTypeId = null,
        int priority = 0)
    {
        Id = Guid.NewGuid();
        CountryProfileId = countryProfileId;
        TargetFieldCode = targetFieldCode ?? throw new ArgumentNullException(nameof(targetFieldCode));
        RuleExpression = ruleExpression ?? throw new ArgumentNullException(nameof(ruleExpression));
        IsVisible = isVisible;
        EntityTypeId = entityTypeId;
        Priority = priority;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string ruleExpression,
        bool isVisible = true,
        Guid? entityTypeId = null,
        int priority = 0)
    {
        RuleExpression = ruleExpression ?? throw new ArgumentNullException(nameof(ruleExpression));
        IsVisible = isVisible;
        EntityTypeId = entityTypeId;
        Priority = priority;
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

