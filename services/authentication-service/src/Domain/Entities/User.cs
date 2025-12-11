using System.ComponentModel.DataAnnotations;

namespace AuthenticationService.Domain.Entities;

/// <summary>
/// User aggregate root for authentication service
/// </summary>
public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string? MiddleName { get; private set; }
    public string? ProfileImageUrl { get; private set; }
    public UserStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    
    // Identity provider information
    public List<UserIdentity> Identities { get; private set; } = new();
    
    // Organization memberships
    public List<UserOrganization> Organizations { get; private set; } = new();
    
    // Roles and permissions
    public List<UserRole> Roles { get; private set; } = new();
    
    // User preferences
    public UserPreferences? Preferences { get; private set; }
    
    // Domain events
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    // Private constructor for EF Core
    private User() { }

    /// <summary>
    /// Create a new user from external identity provider
    /// </summary>
    public static User CreateFromIdentityProvider(
        string email,
        string firstName,
        string lastName,
        string? middleName,
        string providerId,
        string providerUserId,
        string providerType,
        Dictionary<string, string>? claims = null)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email.ToLowerInvariant(),
            FirstName = firstName,
            LastName = lastName,
            MiddleName = middleName,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add identity provider information
        var identity = UserIdentity.Create(
            user.Id,
            providerId,
            providerUserId,
            providerType,
            claims);
        
        user.Identities.Add(identity);

        // Add domain event
        user.AddDomainEvent(new UserCreatedEvent(
            user.Id,
            user.Email,
            user.GetFullName(),
            providerType,
            DateTime.UtcNow));

        return user;
    }

    /// <summary>
    /// Update user profile information
    /// </summary>
    public void UpdateProfile(
        string firstName,
        string lastName,
        string? middleName = null,
        string? profileImageUrl = null)
    {
        FirstName = firstName;
        LastName = lastName;
        MiddleName = middleName;
        ProfileImageUrl = profileImageUrl;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserProfileUpdatedEvent(
            Id,
            Email,
            GetFullName(),
            DateTime.UtcNow));
    }

    /// <summary>
    /// Record user login
    /// </summary>
    public void RecordLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserLoggedInEvent(
            Id,
            Email,
            DateTime.UtcNow));
    }

    /// <summary>
    /// Add user to organization
    /// </summary>
    public void AddToOrganization(Guid organizationId, string role = "member")
    {
        if (Organizations.Any(o => o.OrganizationId == organizationId))
            return; // Already a member

        var membership = UserOrganization.Create(Id, organizationId, role);
        Organizations.Add(membership);
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserAddedToOrganizationEvent(
            Id,
            organizationId,
            role,
            DateTime.UtcNow));
    }

    /// <summary>
    /// Add role to user
    /// </summary>
    public void AddRole(string roleName, string? scope = null)
    {
        if (Roles.Any(r => r.RoleName == roleName && r.Scope == scope))
            return; // Already has role

        var role = UserRole.Create(Id, roleName, scope);
        Roles.Add(role);
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserRoleAssignedEvent(
            Id,
            roleName,
            scope,
            DateTime.UtcNow));
    }

    /// <summary>
    /// Check if user has specific role
    /// </summary>
    public bool HasRole(string roleName, string? scope = null)
    {
        return Roles.Any(r => r.RoleName == roleName && 
                             (scope == null || r.Scope == scope));
    }

    /// <summary>
    /// Deactivate user account
    /// </summary>
    public void Deactivate(string reason)
    {
        Status = UserStatus.Inactive;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserDeactivatedEvent(
            Id,
            Email,
            reason,
            DateTime.UtcNow));
    }

    public string GetFullName() => string.IsNullOrWhiteSpace(MiddleName)
        ? $"{FirstName} {LastName}"
        : $"{FirstName} {MiddleName} {LastName}";

    public void ClearDomainEvents() => _domainEvents.Clear();
    
    private void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
}

/// <summary>
/// User status enumeration
/// </summary>
public enum UserStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    PendingVerification = 4
}

/// <summary>
/// User identity from external provider
/// </summary>
public class UserIdentity
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string ProviderId { get; private set; } = string.Empty;
    public string ProviderUserId { get; private set; } = string.Empty;
    public string ProviderType { get; private set; } = string.Empty;
    public Dictionary<string, string> Claims { get; private set; } = new();
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private UserIdentity() { }

    public static UserIdentity Create(
        Guid userId,
        string providerId,
        string providerUserId,
        string providerType,
        Dictionary<string, string>? claims = null)
    {
        return new UserIdentity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProviderId = providerId,
            ProviderUserId = providerUserId,
            ProviderType = providerType,
            Claims = claims ?? new Dictionary<string, string>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}

/// <summary>
/// User organization membership
/// </summary>
public class UserOrganization
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Role { get; private set; } = string.Empty;
    public DateTime JoinedAt { get; private set; }
    public DateTime? LeftAt { get; private set; }
    public bool IsActive { get; private set; }

    private UserOrganization() { }

    public static UserOrganization Create(Guid userId, Guid organizationId, string role)
    {
        return new UserOrganization
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrganizationId = organizationId,
            Role = role,
            JoinedAt = DateTime.UtcNow,
            IsActive = true
        };
    }
}

/// <summary>
/// User role assignment
/// </summary>
public class UserRole
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string RoleName { get; private set; } = string.Empty;
    public string? Scope { get; private set; }
    public DateTime AssignedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public bool IsActive { get; private set; }

    private UserRole() { }

    public static UserRole Create(Guid userId, string roleName, string? scope = null)
    {
        return new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoleName = roleName,
            Scope = scope,
            AssignedAt = DateTime.UtcNow,
            IsActive = true
        };
    }
}

/// <summary>
/// User preferences
/// </summary>
public class UserPreferences
{
    public Guid UserId { get; set; }
    public string Language { get; set; } = "en";
    public string TimeZone { get; set; } = "UTC";
    public string Theme { get; set; } = "light";
    public Dictionary<string, object> Settings { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
}

// Domain Events
public interface IDomainEvent
{
    Guid Id { get; }
    DateTime OccurredAt { get; }
}

public record UserCreatedEvent(
    Guid UserId,
    string Email,
    string FullName,
    string ProviderType,
    DateTime OccurredAt) : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
}

public record UserProfileUpdatedEvent(
    Guid UserId,
    string Email,
    string FullName,
    DateTime OccurredAt) : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
}

public record UserLoggedInEvent(
    Guid UserId,
    string Email,
    DateTime OccurredAt) : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
}

public record UserAddedToOrganizationEvent(
    Guid UserId,
    Guid OrganizationId,
    string Role,
    DateTime OccurredAt) : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
}

public record UserRoleAssignedEvent(
    Guid UserId,
    string RoleName,
    string? Scope,
    DateTime OccurredAt) : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
}

public record UserDeactivatedEvent(
    Guid UserId,
    string Email,
    string Reason,
    DateTime OccurredAt) : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
}
