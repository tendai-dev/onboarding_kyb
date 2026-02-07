namespace OnboardingApi.Domain.WorkQueue.Enums;

/// <summary>
/// Strongly-typed enum for work item step review fields.
/// Replaces magic strings like "completed", "verified", "approved".
/// </summary>
public enum ReviewField
{
    Completed,
    Verified,
    Approved
}

public static class ReviewFieldExtensions
{
    public static string ToColumnName(this ReviewField field) => field switch
    {
        ReviewField.Completed => "completed",
        ReviewField.Verified => "verified",
        ReviewField.Approved => "approved",
        _ => throw new ArgumentOutOfRangeException(nameof(field))
    };

    public static ReviewField? ParseReviewField(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.ToLowerInvariant() switch
        {
            "completed" => ReviewField.Completed,
            "verified" => ReviewField.Verified,
            "approved" => ReviewField.Approved,
            _ => null
        };
    }
}
