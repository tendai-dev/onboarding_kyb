using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Infrastructure.Persistence.Checklist;

public class ChecklistTypeConverter : ValueConverter<ChecklistType, string>
{
    public ChecklistTypeConverter() : base(
        v => v.ToString(),
        v => ParseChecklistType(v))
    {
    }

    private static ChecklistType ParseChecklistType(string value)
    {
        // Try to parse enum value
        if (Enum.TryParse<ChecklistType>(value, true, out var result))
        {
            return result;
        }

        // Handle known legacy values
        if (string.Equals(value, "KYC", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(value, "KYB", StringComparison.OrdinalIgnoreCase))
        {
            return ChecklistType.Corporate;
        }

        // Default fallback
        return ChecklistType.Corporate;
    }
}

