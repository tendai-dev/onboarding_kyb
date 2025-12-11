namespace OnboardingApi.Application.Interfaces;

/// <summary>
/// Interface for mapping users to organizations
/// Since Keycloak doesn't provide organization information in tokens,
/// the application needs to handle this mapping
/// </summary>
public interface IOrganizationMapper
{
    /// <summary>
    /// Get organization ID for a user based on their email/username
    /// </summary>
    /// <param name="email">User's email (from preferred_username in KC)</param>
    /// <returns>Organization ID or null if not found</returns>
    Task<string?> GetOrganizationIdAsync(string email);

    /// <summary>
    /// Get organization details for a user
    /// </summary>
    /// <param name="email">User's email</param>
    /// <returns>Organization information</returns>
    Task<OrganizationInfo?> GetOrganizationAsync(string email);

    /// <summary>
    /// Map a user to an organization (for registration/onboarding)
    /// </summary>
    /// <param name="email">User's email</param>
    /// <param name="organizationId">Organization ID</param>
    Task MapUserToOrganizationAsync(string email, string organizationId);

    /// <summary>
    /// Check if user belongs to a specific organization
    /// </summary>
    /// <param name="email">User's email</param>
    /// <param name="organizationId">Organization ID to check</param>
    /// <returns>True if user belongs to organization</returns>
    Task<bool> BelongsToOrganizationAsync(string email, string organizationId);
}

/// <summary>
/// Organization information model
/// </summary>
public class OrganizationInfo
{
    public string OrganizationId { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? BusinessType { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}


