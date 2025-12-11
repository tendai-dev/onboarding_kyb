using System.Security.Claims;

namespace OnboardingApi.Application.Interfaces;

/// <summary>
/// Interface for accessing current authenticated user information
/// </summary>
public interface ICurrentUser
{
    /// <summary>
    /// Gets the current user's ClaimsPrincipal
    /// </summary>
    ClaimsPrincipal? Principal { get; }

    /// <summary>
    /// Gets the current user's unique identifier
    /// </summary>
    string UserId { get; }

    /// <summary>
    /// Gets the current user's email address
    /// </summary>
    string Email { get; }

    /// <summary>
    /// Gets the current user's display name
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets whether the user is authenticated
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Gets the authentication scheme used (Keycloak, AzureAD, ActiveDirectory)
    /// </summary>
    string? AuthenticationScheme { get; }

    /// <summary>
    /// Gets the user's roles
    /// </summary>
    IEnumerable<string> Roles { get; }

    /// <summary>
    /// Gets the user's groups (for Azure AD)
    /// </summary>
    IEnumerable<string> Groups { get; }

    /// <summary>
    /// Gets complete user information asynchronously
    /// </summary>
    Task<UserInfo> GetUserAsync();

    /// <summary>
    /// Checks if the user has a specific role
    /// </summary>
    bool HasRole(string role);

    /// <summary>
    /// Checks if the user belongs to a specific group
    /// </summary>
    bool BelongsToGroup(string groupId);

    /// <summary>
    /// Gets the organization ID for the current user (for Keycloak external users)
    /// </summary>
    Task<string?> GetOrganizationIdAsync();
}

/// <summary>
/// User information model
/// </summary>
public class UserInfo
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ClaimsIdentity? Identity { get; set; }
    public IEnumerable<string> Roles { get; set; } = Array.Empty<string>();
    public IEnumerable<string> Groups { get; set; } = Array.Empty<string>();
    public string AuthenticationScheme { get; set; } = string.Empty;
    public bool IsAuthenticated { get; set; }
    public string? OrganizationId { get; set; }
    public bool IsExternalUser { get; set; }
    public bool IsInternalUser { get; set; }
}

