using AuthenticationService.Domain.Entities;

namespace AuthenticationService.Application.Services;

/// <summary>
/// Core authentication service interface
/// </summary>
public interface IAuthenticationService
{
    /// <summary>
    /// Validate JWT token and return user context
    /// </summary>
    Task<AuthenticationResult> ValidateTokenAsync(string token);
    
    /// <summary>
    /// Introspect token and return detailed information
    /// </summary>
    Task<TokenIntrospectionResult> IntrospectTokenAsync(string token);
    
    /// <summary>
    /// Refresh JWT token
    /// </summary>
    Task<TokenRefreshResult> RefreshTokenAsync(string refreshToken);
    
    /// <summary>
    /// Initiate login flow for external provider
    /// </summary>
    Task<LoginInitiationResult> InitiateLoginAsync(string provider, string? returnUrl = null);
    
    /// <summary>
    /// Handle OAuth callback from external provider
    /// </summary>
    Task<LoginCallbackResult> HandleLoginCallbackAsync(string provider, string code, string? state = null);
    
    /// <summary>
    /// Logout user and invalidate tokens
    /// </summary>
    Task<LogoutResult> LogoutAsync(string userId, string? sessionId = null);
    
    /// <summary>
    /// Get or create user from external identity provider
    /// </summary>
    Task<User> GetOrCreateUserFromProviderAsync(ExternalUserInfo userInfo);
}

/// <summary>
/// User management service interface
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<User?> GetUserByIdAsync(Guid userId);
    
    /// <summary>
    /// Get user by email
    /// </summary>
    Task<User?> GetUserByEmailAsync(string email);
    
    /// <summary>
    /// Get users by organization
    /// </summary>
    Task<List<User>> GetUsersByOrganizationAsync(Guid organizationId);
    
    /// <summary>
    /// Update user profile
    /// </summary>
    Task<User> UpdateUserProfileAsync(Guid userId, UpdateUserProfileRequest request);
    
    /// <summary>
    /// Add user to organization
    /// </summary>
    Task AddUserToOrganizationAsync(Guid userId, Guid organizationId, string role = "member");
    
    /// <summary>
    /// Assign role to user
    /// </summary>
    Task AssignRoleToUserAsync(Guid userId, string roleName, string? scope = null);
    
    /// <summary>
    /// Remove role from user
    /// </summary>
    Task RemoveRoleFromUserAsync(Guid userId, string roleName, string? scope = null);
    
    /// <summary>
    /// Deactivate user account
    /// </summary>
    Task DeactivateUserAsync(Guid userId, string reason);
}

/// <summary>
/// Session management service interface
/// </summary>
public interface ISessionService
{
    /// <summary>
    /// Create new user session
    /// </summary>
    Task<UserSession> CreateSessionAsync(Guid userId, string deviceInfo, string ipAddress);
    
    /// <summary>
    /// Get active sessions for user
    /// </summary>
    Task<List<UserSession>> GetActiveSessionsAsync(Guid userId);
    
    /// <summary>
    /// Invalidate session
    /// </summary>
    Task InvalidateSessionAsync(string sessionId);
    
    /// <summary>
    /// Invalidate all sessions for user
    /// </summary>
    Task InvalidateAllUserSessionsAsync(Guid userId);
    
    /// <summary>
    /// Update session activity
    /// </summary>
    Task UpdateSessionActivityAsync(string sessionId);
}

// DTOs and Result Types

/// <summary>
/// Authentication result
/// </summary>
public class AuthenticationResult
{
    public bool IsValid { get; set; }
    public User? User { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public Dictionary<string, object> Claims { get; set; } = new();
    public string? ErrorMessage { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Token introspection result
/// </summary>
public class TokenIntrospectionResult
{
    public bool Active { get; set; }
    public string? Subject { get; set; }
    public string? Email { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Scopes { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
    public DateTime? IssuedAt { get; set; }
    public string? Issuer { get; set; }
    public Dictionary<string, object> Claims { get; set; } = new();
}

/// <summary>
/// Token refresh result
/// </summary>
public class TokenRefreshResult
{
    public bool Success { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Login initiation result
/// </summary>
public class LoginInitiationResult
{
    public bool Success { get; set; }
    public string? AuthorizationUrl { get; set; }
    public string? State { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Login callback result
/// </summary>
public class LoginCallbackResult
{
    public bool Success { get; set; }
    public User? User { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? RedirectUrl { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Logout result
/// </summary>
public class LogoutResult
{
    public bool Success { get; set; }
    public string? LogoutUrl { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// External user information from identity provider
/// </summary>
public class ExternalUserInfo
{
    public string ProviderId { get; set; } = string.Empty;
    public string ProviderUserId { get; set; } = string.Empty;
    public string ProviderType { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public Dictionary<string, string> Claims { get; set; } = new();
    public List<string> Roles { get; set; } = new();
    public List<string> Groups { get; set; } = new();
}

/// <summary>
/// Update user profile request
/// </summary>
public class UpdateUserProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public UserPreferences? Preferences { get; set; }
}

/// <summary>
/// User session information
/// </summary>
public class UserSession
{
    public string Id { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string DeviceInfo { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}
