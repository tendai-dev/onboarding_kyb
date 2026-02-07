using System.Security.Cryptography;
using System.Text;

namespace OnboardingApi.Infrastructure.Utilities;

/// <summary>
/// Utility for generating deterministic PartnerId from user email.
/// 
/// SECURITY NOTES:
/// - Uses HMAC-SHA256 with application-specific salt to prevent rainbow table attacks
/// - Salt should be configured via environment variable PARTNER_ID_SALT
/// - Changing the salt will invalidate all existing partner IDs (requires migration)
/// - Email enumeration is still theoretically possible but computationally expensive
/// 
/// MIGRATION WARNING:
/// If migrating from the old MD5-based implementation, you must:
/// 1. Run a migration to update all existing partner_id values
/// 2. Or maintain backward compatibility by checking both old and new hashes
/// </summary>
public static class PartnerIdGenerator
{
    // Application-specific salt - should be set via environment variable in production
    // This prevents rainbow table attacks and makes enumeration much harder
    private static readonly byte[] DefaultSalt = Encoding.UTF8.GetBytes("OnboardingKYC-PartnerIdSalt-v2-2024");
    
    private static byte[]? _configuredSalt;
    
    /// <summary>
    /// Configure the salt from environment variable. Call this at application startup.
    /// </summary>
    public static void ConfigureSalt(string? saltValue)
    {
        if (!string.IsNullOrWhiteSpace(saltValue))
        {
            _configuredSalt = Encoding.UTF8.GetBytes(saltValue);
        }
    }
    
    private static byte[] GetSalt()
    {
        return _configuredSalt ?? DefaultSalt;
    }

    /// <summary>
    /// Generates a deterministic GUID from email address using HMAC-SHA256 with salt.
    /// This ensures the same email always produces the same PartnerId within the same application.
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <returns>Deterministic GUID generated from email</returns>
    public static Guid GenerateFromEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be null or empty", nameof(email));

        // Normalize email to lowercase for consistency
        var normalizedEmail = email.ToLowerInvariant().Trim();

        // Use HMAC-SHA256 with salt to generate deterministic hash
        // This prevents rainbow table attacks while maintaining determinism
        using var hmac = new HMACSHA256(GetSalt());
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(normalizedEmail));
        
        // Take first 16 bytes of SHA256 hash (32 bytes) to create GUID
        var guidBytes = new byte[16];
        Array.Copy(hash, guidBytes, 16);
        
        return new Guid(guidBytes);
    }

    /// <summary>
    /// [DEPRECATED] Legacy method for backward compatibility during migration.
    /// Generates PartnerId using the old MD5 algorithm (insecure).
    /// </summary>
    [Obsolete("Use GenerateFromEmail instead. This method is only for migration purposes.")]
    public static Guid GenerateFromEmailLegacy(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be null or empty", nameof(email));

        var normalizedEmail = email.ToLowerInvariant().Trim();

        #pragma warning disable CA5351 // Do not use broken cryptographic algorithms - needed for migration
        using var md5 = MD5.Create();
        #pragma warning restore CA5351
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(normalizedEmail));
        
        return new Guid(hash);
    }

    /// <summary>
    /// Validates that a PartnerId matches the expected value for the given email.
    /// Checks both new (HMAC-SHA256) and legacy (MD5) hashes for backward compatibility.
    /// </summary>
    /// <param name="email">User's email address</param>
    /// <param name="partnerId">PartnerId to validate</param>
    /// <returns>True if PartnerId matches the email (new or legacy), false otherwise</returns>
    public static bool Validate(string email, Guid partnerId)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        // Check new hash first
        var expectedPartnerId = GenerateFromEmail(email);
        if (expectedPartnerId == partnerId)
            return true;

        // Fall back to legacy hash for backward compatibility
        #pragma warning disable CS0618 // Type or member is obsolete
        var legacyPartnerId = GenerateFromEmailLegacy(email);
        #pragma warning restore CS0618
        return legacyPartnerId == partnerId;
    }
    
    /// <summary>
    /// Checks if a PartnerId was generated using the legacy (insecure) algorithm.
    /// Useful for identifying records that need migration.
    /// </summary>
    public static bool IsLegacyPartnerId(string email, Guid partnerId)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        #pragma warning disable CS0618 // Type or member is obsolete
        var legacyPartnerId = GenerateFromEmailLegacy(email);
        #pragma warning restore CS0618
        return legacyPartnerId == partnerId;
    }
}

