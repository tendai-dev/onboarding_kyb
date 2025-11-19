namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// Role aggregate root - represents a role that can contain multiple permissions
/// </summary>
public class Role
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string? CreatedBy { get; private set; }
    
    // Navigation property for role permissions
    private readonly List<RolePermission> _permissions = new();
    public IReadOnlyCollection<RolePermission> Permissions => _permissions.AsReadOnly();
    
    // Navigation property for user roles
    private readonly List<UserRole> _userRoles = new();
    public IReadOnlyCollection<UserRole> UserRoles => _userRoles.AsReadOnly();

    // Private constructor for EF Core
    private Role() { }

    /// <summary>
    /// Create a new role
    /// </summary>
    public static Role Create(string name, string displayName, string? description = null, string? createdBy = null)
    {
        var now = DateTime.UtcNow;
        return new Role
        {
            Id = Guid.NewGuid(),
            Name = name.ToLowerInvariant().Trim(),
            DisplayName = displayName,
            Description = description,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = createdBy
        };
    }

    /// <summary>
    /// Update role details
    /// </summary>
    public void Update(string displayName, string? description = null)
    {
        DisplayName = displayName;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Deactivate this role
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Activate this role
    /// </summary>
    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Add a permission to this role
    /// </summary>
    public void AddPermission(string permissionName, string? resource = null)
    {
        if (_permissions.Any(p => p.PermissionName == permissionName && p.Resource == resource))
        {
            throw new InvalidOperationException($"Permission '{permissionName}' already exists in this role");
        }

        _permissions.Add(RolePermission.Create(Id, permissionName, resource));
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Remove a permission from this role
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
    /// Check if role has a specific permission
    /// </summary>
    public bool HasPermission(string permissionName, string? resource = null)
    {
        return _permissions.Any(p => 
            p.PermissionName == permissionName && 
            p.IsActive &&
            (resource == null || p.Resource == null || p.Resource == resource));
    }
}

/// <summary>
/// Role permission entity - links permissions to roles
/// </summary>
public class RolePermission
{
    public Guid Id { get; private set; }
    public Guid RoleId { get; private set; }
    public string PermissionName { get; private set; } = string.Empty;
    public string? Resource { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property
    public Role? Role { get; private set; }

    // Private constructor for EF Core
    private RolePermission() { }

    /// <summary>
    /// Create a new role permission
    /// </summary>
    public static RolePermission Create(Guid roleId, string permissionName, string? resource = null)
    {
        var now = DateTime.UtcNow;
        return new RolePermission
        {
            Id = Guid.NewGuid(),
            RoleId = roleId,
            PermissionName = permissionName,
            Resource = resource,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
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
}

/// <summary>
/// User role entity - links users to roles
/// </summary>
public class UserRole
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid RoleId { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string? CreatedBy { get; private set; }

    // Navigation properties
    public User? User { get; private set; }
    public Role? Role { get; private set; }

    // Private constructor for EF Core
    private UserRole() { }

    /// <summary>
    /// Create a new user role assignment
    /// </summary>
    public static UserRole Create(Guid userId, Guid roleId, string? createdBy = null)
    {
        var now = DateTime.UtcNow;
        return new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoleId = roleId,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = createdBy
        };
    }

    /// <summary>
    /// Deactivate this user role assignment
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Activate this user role assignment
    /// </summary>
    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }
}

