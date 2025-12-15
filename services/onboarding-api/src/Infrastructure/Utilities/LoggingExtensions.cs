using System;
using System.Text.RegularExpressions;

namespace OnboardingApi.Infrastructure.Utilities;

/// <summary>
/// SECURITY: Extension methods for masking PII in logs
/// </summary>
public static class LoggingExtensions
{
    /// <summary>
    /// Masks email addresses in logs (e.g., jo***@example.com)
    /// </summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@'))
            return email ?? "***";

        var parts = email.Split('@');
        if (parts.Length != 2)
            return "***";

        var localPart = parts[0];
        var domain = parts[1];

        // Show first 2 characters, mask the rest
        var maskedLocal = localPart.Length > 2
            ? localPart.Substring(0, 2) + "***"
            : "***";

        return $"{maskedLocal}@{domain}";
    }

    /// <summary>
    /// Masks GUIDs in logs (e.g., 12345678-****-****-****-************)
    /// </summary>
    public static string MaskGuid(Guid guid)
    {
        var guidString = guid.ToString();
        if (guidString.Length < 8)
            return "***";

        return guidString.Substring(0, 8) + "-****-****-****-************";
    }

    /// <summary>
    /// Masks phone numbers in logs
    /// </summary>
    public static string MaskPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone))
            return "***";

        // Keep country code if present, mask the rest
        var cleaned = Regex.Replace(phone, @"[^\d+]", "");
        if (cleaned.Length <= 4)
            return "***";

        return cleaned.Substring(0, Math.Min(4, cleaned.Length)) + "***";
    }

    /// <summary>
    /// Masks any string that might contain PII
    /// </summary>
    public static string MaskPii(string? value, int visibleChars = 2)
    {
        if (string.IsNullOrEmpty(value))
            return "***";

        if (value.Length <= visibleChars)
            return "***";

        return value.Substring(0, visibleChars) + "***";
    }

    /// <summary>
    /// Masks credit card numbers (shows last 4 digits only)
    /// </summary>
    public static string MaskCreditCard(string? cardNumber)
    {
        if (string.IsNullOrEmpty(cardNumber))
            return "***";

        var cleaned = Regex.Replace(cardNumber, @"[^\d]", "");
        if (cleaned.Length < 4)
            return "****";

        return "****-****-****-" + cleaned.Substring(cleaned.Length - 4);
    }

    /// <summary>
    /// Masks SSN/Tax ID (shows last 4 digits only)
    /// </summary>
    public static string MaskSsn(string? ssn)
    {
        if (string.IsNullOrEmpty(ssn))
            return "***";

        var cleaned = Regex.Replace(ssn, @"[^\d]", "");
        if (cleaned.Length < 4)
            return "***-**-****";

        return "***-**-" + cleaned.Substring(cleaned.Length - 4);
    }
}

