namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// User aggregate root for storing user emails and managing permissions
/// </summary>
public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string? Name { get; private set; }
    public DateTime FirstLoginAt { get; private set; }
    public DateTime LastLoginAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    
    // Navigation property for permissions
    private readonly List<UserPermission> _permissions = new();
    public IReadOnlyCollection<UserPermission> Permissions => _permissions.AsReadOnly();
    
    // Navigation property for roles
    private readonly List<UserRole> _roles = new();
    public IReadOnlyCollection<UserRole> Roles => _roles.AsReadOnly();

    // Private constructor for EF Core
    private User() { }

    /// <summary>
    /// Create a new user from email (automatically called on first login)
    /// </summary>
    public static User Create(string email, string? name = null)
    {
        var now = DateTime.UtcNow;
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.ToLowerInvariant().Trim(),
            Name = name,
            FirstLoginAt = now,
            LastLoginAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    /// <summary>
    /// Update last login time
    /// </summary>
    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update user name
    /// </summary>
    public void UpdateName(string? name)
    {
        Name = name;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Add a permission to this user
    /// </summary>
    public void AddPermission(string permissionName, string? resource = null, string? description = null)
    {
        if (_permissions.Any(p => p.PermissionName == permissionName && p.Resource == resource))
        {
            throw new InvalidOperationException($"Permission '{permissionName}' already exists for this user");
        }

        _permissions.Add(UserPermission.Create(Id, permissionName, resource, description));
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Remove a permission from this user
    /// </summary>
    public void RemovePermission(Guid permissionId)
    {
        var permission = _permissions.FirstOrDefault(p => p.Id == permissionId);
        if (permission != null)
        {
            _permissions.Remove(permission);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Check if user has a specific permission
    /// </summary>
    public bool HasPermission(string permissionName, string? resource = null)
    {
        return _permissions.Any(p => 
            p.PermissionName == permissionName && 
            p.IsActive &&
            (resource == null || p.Resource == null || p.Resource == resource));
    }

    /// <summary>
    /// Add a role to this user
    /// </summary>
    public void AddRole(Guid roleId, string? createdBy = null)
    {
        if (_roles.Any(ur => ur.RoleId == roleId && ur.IsActive))
        {
            throw new InvalidOperationException($"User already has this role");
        }

        _roles.Add(UserRole.Create(Id, roleId, createdBy));
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Remove a role from this user
    /// </summary>
    public void RemoveRole(Guid userRoleId)
    {
        var userRole = _roles.FirstOrDefault(ur => ur.Id == userRoleId);
        if (userRole != null)
        {
            _roles.Remove(userRole);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Check if user has a specific role
    /// </summary>
    public bool HasRole(Guid roleId)
    {
        return _roles.Any(ur => ur.RoleId == roleId && ur.IsActive);
    }
}

/// <summary>
/// User permission entity
/// </summary>
public class UserPermission
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string PermissionName { get; private set; } = string.Empty;
    public string? Resource { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string? CreatedBy { get; private set; }

    // Navigation property
    public User? User { get; private set; }

    // Private constructor for EF Core
    private UserPermission() { }

    /// <summary>
    /// Create a new permission
    /// </summary>
    public static UserPermission Create(Guid userId, string permissionName, string? resource = null, string? description = null, string? createdBy = null)
    {
        var now = DateTime.UtcNow;
        return new UserPermission
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PermissionName = permissionName,
            Resource = resource,
            Description = description,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = createdBy
        };
    }

    /// <summary>
    /// Deactivate this permission
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Activate this permission
    /// </summary>
    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update permission details
    /// </summary>
    public void Update(string? description = null, string? resource = null)
    {
        if (description != null)
            Description = description;
        if (resource != null)
            Resource = resource;
        UpdatedAt = DateTime.UtcNow;
    }
}

