using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.Extensions;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Implementation of ICurrentUser that retrieves user information from HttpContext
/// </summary>
public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IOrganizationMapper _organizationMapper;

    public CurrentUser(
        IHttpContextAccessor httpContextAccessor,
        IOrganizationMapper organizationMapper)
    {
        _httpContextAccessor = httpContextAccessor;
        _organizationMapper = organizationMapper;
    }

    public ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

    public string UserId
    {
        get
        {
            if (Principal == null) return string.Empty;

            // Try different claim types for user ID
            return Principal.FindFirst("sub")?.Value ??
                   Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                   Principal.FindFirst("oid")?.Value ?? // Azure AD Object ID
                   Principal.FindFirst("upn")?.Value ??
                   Principal.Identity?.Name ??
                   string.Empty;
        }
    }

    public string Email
    {
        get
        {
            if (Principal == null) return string.Empty;

            return Principal.FindFirst("email")?.Value ??
                   Principal.FindFirst(ClaimTypes.Email)?.Value ??
                   Principal.FindFirst("upn")?.Value ??
                   Principal.FindFirst("preferred_username")?.Value ??
                   string.Empty;
        }
    }

    public string Name
    {
        get
        {
            if (Principal == null) return string.Empty;

            return Principal.FindFirst("name")?.Value ??
                   Principal.FindFirst(ClaimTypes.Name)?.Value ??
                   Principal.FindFirst("given_name")?.Value ??
                   Principal.Identity?.Name ??
                   string.Empty;
        }
    }

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public string? AuthenticationScheme => Principal?.Identity?.AuthenticationType;

    public IEnumerable<string> Roles
    {
        get
        {
            if (Principal == null) return Array.Empty<string>();

            var roles = new List<string>();

            // Get roles from different claim types
            roles.AddRange(Principal.FindAll("roles").Select(c => c.Value));
            roles.AddRange(Principal.FindAll(ClaimTypes.Role).Select(c => c.Value));
            roles.AddRange(Principal.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role").Select(c => c.Value));

            // Parse Keycloak realm_access
            var realmAccess = Principal.FindFirst("realm_access")?.Value;
            if (!string.IsNullOrEmpty(realmAccess))
            {
                // Simple parsing - in production, use JSON deserialization
                if (realmAccess.Contains("admin")) roles.Add("admin");
                if (realmAccess.Contains("reviewer")) roles.Add("reviewer");
                if (realmAccess.Contains("approver")) roles.Add("approver");
                if (realmAccess.Contains("partner")) roles.Add("partner");
            }

            return roles.Distinct();
        }
    }

    public IEnumerable<string> Groups
    {
        get
        {
            if (Principal == null) return Array.Empty<string>();

            // Get Azure AD groups
            return Principal.FindAll("groups").Select(c => c.Value);
        }
    }

    public async Task<UserInfo> GetUserAsync()
    {
        string? organizationId = null;
        var isExternal = Principal?.IsExternalUser() ?? false;
        var isInternal = Principal?.IsInternalUser() ?? false;

        // For external users (Keycloak), get organization from mapper
        if (isExternal && !string.IsNullOrEmpty(Email))
        {
            organizationId = await _organizationMapper.GetOrganizationIdAsync(Email);
        }

        return new UserInfo
        {
            UserId = UserId,
            Email = Email,
            Name = Name,
            Identity = Principal?.Identity as ClaimsIdentity,
            Roles = Roles,
            Groups = Groups,
            AuthenticationScheme = AuthenticationScheme ?? string.Empty,
            IsAuthenticated = IsAuthenticated,
            OrganizationId = organizationId,
            IsExternalUser = isExternal,
            IsInternalUser = isInternal
        };
    }

    public async Task<string?> GetOrganizationIdAsync()
    {
        if (string.IsNullOrEmpty(Email))
            return null;

        return await _organizationMapper.GetOrganizationIdAsync(Email);
    }

    public bool HasRole(string role)
    {
        return Roles.Any(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
    }

    public bool BelongsToGroup(string groupId)
    {
        return Groups.Any(g => g.Equals(groupId, StringComparison.OrdinalIgnoreCase));
    }
}

