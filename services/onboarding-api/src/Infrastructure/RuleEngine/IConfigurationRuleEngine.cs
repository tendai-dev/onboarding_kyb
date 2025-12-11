using OnboardingApi.Domain.EntityConfiguration.ValueObjects;

namespace OnboardingApi.Infrastructure.RuleEngine;

/// <summary>
/// Service for evaluating configuration rules based on context data.
/// Supports TAG-based rule evaluation for flexible country configuration.
/// </summary>
public interface IConfigurationRuleEngine
{
    /// <summary>
    /// Evaluates a rule expression against the provided context.
    /// </summary>
    /// <param name="rule">The rule to evaluate</param>
    /// <param name="context">Context data (e.g., country, entityType, tags, etc.)</param>
    /// <returns>True if the rule matches, false otherwise</returns>
    bool EvaluateRule(ConfigurationRule rule, Dictionary<string, object> context);

    /// <summary>
    /// Evaluates a rule expression from JSON string against the provided context.
    /// </summary>
    /// <param name="ruleExpressionJson">JSON string representing the rule</param>
    /// <param name="context">Context data</param>
    /// <returns>True if the rule matches, false otherwise</returns>
    bool EvaluateRuleFromJson(string ruleExpressionJson, Dictionary<string, object> context);

    /// <summary>
    /// Checks if a country profile matches the given tags.
    /// </summary>
    /// <param name="countryProfileTags">Tags from the country profile</param>
    /// <param name="requiredTags">Tags that must be present</param>
    /// <returns>True if all required tags are present</returns>
    bool MatchesTags(Dictionary<string, List<string>> countryProfileTags, Dictionary<string, List<string>> requiredTags);
}

