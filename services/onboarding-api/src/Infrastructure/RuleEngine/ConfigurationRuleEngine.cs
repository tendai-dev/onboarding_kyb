using System.Text.Json;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.EntityConfiguration.ValueObjects;

namespace OnboardingApi.Infrastructure.RuleEngine;

/// <summary>
/// Implementation of the configuration rule engine.
/// Evaluates rules using AND, OR, NOT operators and various comparison operators.
/// </summary>
public class ConfigurationRuleEngine : IConfigurationRuleEngine
{
    private readonly ILogger<ConfigurationRuleEngine> _logger;

    public ConfigurationRuleEngine(ILogger<ConfigurationRuleEngine> logger)
    {
        _logger = logger;
    }

    public bool EvaluateRule(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (rule == null)
            return false;

        try
        {
            return EvaluateRuleInternal(rule, context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating rule: {Operator}", rule.Operator);
            return false;
        }
    }

    public bool EvaluateRuleFromJson(string ruleExpressionJson, Dictionary<string, object> context)
    {
        if (string.IsNullOrWhiteSpace(ruleExpressionJson))
            return false;

        try
        {
            var rule = JsonSerializer.Deserialize<ConfigurationRule>(ruleExpressionJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (rule == null)
                return false;

            return EvaluateRule(rule, context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deserializing rule expression: {RuleJson}", ruleExpressionJson);
            return false;
        }
    }

    public bool MatchesTags(Dictionary<string, List<string>> countryProfileTags, Dictionary<string, List<string>> requiredTags)
    {
        if (requiredTags == null || requiredTags.Count == 0)
            return true; // No requirements means match

        foreach (var requiredTag in requiredTags)
        {
            var tagName = requiredTag.Key;
            var requiredValues = requiredTag.Value;

            if (!countryProfileTags.ContainsKey(tagName))
                return false; // Tag name doesn't exist

            var countryValues = countryProfileTags[tagName];

            // If no specific values required, just check if tag exists
            if (requiredValues == null || requiredValues.Count == 0)
                continue;

            // Check if any of the required values match
            var hasMatch = requiredValues.Any(rv => countryValues.Contains(rv, StringComparer.OrdinalIgnoreCase));
            if (!hasMatch)
                return false;
        }

        return true;
    }

    private bool EvaluateRuleInternal(ConfigurationRule rule, Dictionary<string, object> context)
    {
        return rule.Operator.ToUpperInvariant() switch
        {
            "AND" => EvaluateAnd(rule, context),
            "OR" => EvaluateOr(rule, context),
            "NOT" => EvaluateNot(rule, context),
            "EQUALS" => EvaluateEquals(rule, context),
            "NOT_EQUALS" => !EvaluateEquals(rule, context),
            "CONTAINS" => EvaluateContains(rule, context),
            "IN" => EvaluateIn(rule, context),
            "EXISTS" => EvaluateExists(rule, context),
            "GREATER_THAN" => EvaluateGreaterThan(rule, context),
            "LESS_THAN" => EvaluateLessThan(rule, context),
            _ => false
        };
    }

    private bool EvaluateAnd(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (rule.Conditions == null || rule.Conditions.Count == 0)
            return false;

        return rule.Conditions.All(condition => EvaluateRuleInternal(condition, context));
    }

    private bool EvaluateOr(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (rule.Conditions == null || rule.Conditions.Count == 0)
            return false;

        return rule.Conditions.Any(condition => EvaluateRuleInternal(condition, context));
    }

    private bool EvaluateNot(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (rule.Conditions == null || rule.Conditions.Count == 0)
            return false;

        return !EvaluateRuleInternal(rule.Conditions[0], context);
    }

    private bool EvaluateEquals(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (string.IsNullOrEmpty(rule.Field) || rule.Value == null)
            return false;

        var fieldValue = GetFieldValue(rule.Field, context);
        if (fieldValue == null)
            return false;

        return string.Equals(fieldValue.ToString(), rule.Value.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private bool EvaluateContains(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (string.IsNullOrEmpty(rule.Field) || rule.Value == null)
            return false;

        var fieldValue = GetFieldValue(rule.Field, context);
        if (fieldValue == null)
            return false;

        var fieldStr = fieldValue.ToString() ?? string.Empty;
        var valueStr = rule.Value.ToString() ?? string.Empty;

        return fieldStr.Contains(valueStr, StringComparison.OrdinalIgnoreCase);
    }

    private bool EvaluateIn(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (string.IsNullOrEmpty(rule.Field) || rule.Value == null)
            return false;

        var fieldValue = GetFieldValue(rule.Field, context);
        if (fieldValue == null)
            return false;

        // Value should be an array or list
        if (rule.Value is not System.Collections.IEnumerable enumerable)
            return false;

        var fieldStr = fieldValue.ToString() ?? string.Empty;
        return enumerable.Cast<object>().Any(v => string.Equals(fieldStr, v.ToString(), StringComparison.OrdinalIgnoreCase));
    }

    private bool EvaluateExists(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (string.IsNullOrEmpty(rule.Field))
            return false;

        // Handle tag: syntax
        if (rule.Field.StartsWith("tag:", StringComparison.OrdinalIgnoreCase))
        {
            var tagParts = rule.Field.Substring(4).Split(':');
            if (tagParts.Length >= 1)
            {
                var tagName = tagParts[0];
                var tagValue = tagParts.Length > 1 ? tagParts[1] : null;

                var tagKey = $"tag:{tagName}";
                if (context.ContainsKey(tagKey))
                {
                    if (tagValue == null)
                        return true; // Just checking if tag exists

                    var contextValue = context[tagKey];
                    if (contextValue is List<string> tagValues)
                        return tagValues.Contains(tagValue, StringComparer.OrdinalIgnoreCase);
                    if (contextValue is string strValue)
                        return string.Equals(strValue, tagValue, StringComparison.OrdinalIgnoreCase);
                }
            }
            return false;
        }

        return context.ContainsKey(rule.Field);
    }

    private bool EvaluateGreaterThan(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (string.IsNullOrEmpty(rule.Field) || rule.Value == null)
            return false;

        var fieldValue = GetFieldValue(rule.Field, context);
        if (fieldValue == null)
            return false;

        if (decimal.TryParse(fieldValue.ToString(), out var fieldDecimal) &&
            decimal.TryParse(rule.Value.ToString(), out var valueDecimal))
        {
            return fieldDecimal > valueDecimal;
        }

        return false;
    }

    private bool EvaluateLessThan(ConfigurationRule rule, Dictionary<string, object> context)
    {
        if (string.IsNullOrEmpty(rule.Field) || rule.Value == null)
            return false;

        var fieldValue = GetFieldValue(rule.Field, context);
        if (fieldValue == null)
            return false;

        if (decimal.TryParse(fieldValue.ToString(), out var fieldDecimal) &&
            decimal.TryParse(rule.Value.ToString(), out var valueDecimal))
        {
            return fieldDecimal < valueDecimal;
        }

        return false;
    }

    private object? GetFieldValue(string field, Dictionary<string, object> context)
    {
        if (context.ContainsKey(field))
            return context[field];

        // Try case-insensitive lookup
        var matchingKey = context.Keys.FirstOrDefault(k => 
            string.Equals(k, field, StringComparison.OrdinalIgnoreCase));
        
        if (matchingKey != null)
            return context[matchingKey];

        return null;
    }
}

