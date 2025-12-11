namespace OnboardingApi.Domain.EntityConfiguration.ValueObjects;

/// <summary>
/// Represents a rule expression that can be evaluated by the rule engine.
/// Supports complex conditions using AND, OR, NOT operators and various comparison operators.
/// </summary>
public class ConfigurationRule
{
    public string Operator { get; set; } = string.Empty; // "AND", "OR", "NOT", "EQUALS", "CONTAINS", "IN", "EXISTS"
    public string? Field { get; set; } // Field name to evaluate (e.g., "country", "entityType", "tag:REGION")
    public object? Value { get; set; } // Value to compare against
    public List<ConfigurationRule>? Conditions { get; set; } // Nested conditions for AND/OR operators

    public ConfigurationRule()
    {
    }

    public ConfigurationRule(string @operator)
    {
        Operator = @operator;
    }

    /// <summary>
    /// Creates a simple equality rule
    /// </summary>
    public static ConfigurationRule Equals(string field, object value)
    {
        return new ConfigurationRule("EQUALS")
        {
            Field = field,
            Value = value
        };
    }

    /// <summary>
    /// Creates an AND rule with multiple conditions
    /// </summary>
    public static ConfigurationRule And(params ConfigurationRule[] conditions)
    {
        return new ConfigurationRule("AND")
        {
            Conditions = conditions.ToList()
        };
    }

    /// <summary>
    /// Creates an OR rule with multiple conditions
    /// </summary>
    public static ConfigurationRule Or(params ConfigurationRule[] conditions)
    {
        return new ConfigurationRule("OR")
        {
            Conditions = conditions.ToList()
        };
    }

    /// <summary>
    /// Creates a NOT rule (negates a condition)
    /// </summary>
    public static ConfigurationRule Not(ConfigurationRule condition)
    {
        return new ConfigurationRule("NOT")
        {
            Conditions = new List<ConfigurationRule> { condition }
        };
    }

    /// <summary>
    /// Creates a tag-based rule (checks if a tag exists or has a specific value)
    /// </summary>
    public static ConfigurationRule HasTag(string tagName, string? tagValue = null)
    {
        var field = tagValue != null ? $"tag:{tagName}:{tagValue}" : $"tag:{tagName}";
        return new ConfigurationRule("EXISTS")
        {
            Field = field
        };
    }
}

