using System.Security.Cryptography;
using System.Text;

namespace OnboardingApi.Infrastructure.Utilities;

/// <summary>
/// Utility for generating deterministic PartnerId from user email
/// Uses MD5 hash to ensure consistency across services
/// </summary>
public static class PartnerIdGenerator
{
    /// <summary>
    /// Generates a deterministic GUID from email address
    /// This ensures the same email always produces the same PartnerId
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <returns>Deterministic GUID generated from email</returns>
    public static Guid GenerateFromEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be null or empty", nameof(email));

        // Normalize email to lowercase for consistency
        var normalizedEmail = email.ToLowerInvariant().Trim();

        // Use MD5 hash to generate deterministic GUID
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(normalizedEmail));
        
        // Convert MD5 hash (16 bytes) to GUID
        return new Guid(hash);
    }

    /// <summary>
    /// Validates that a PartnerId matches the expected value for the given email
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <param name="partnerId">PartnerId to validate</param>
    /// <returns>True if PartnerId matches the email, false otherwise</returns>
    public static bool Validate(string email, Guid partnerId)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        var expectedPartnerId = GenerateFromEmail(email);
        return expectedPartnerId == partnerId;
    }
}

