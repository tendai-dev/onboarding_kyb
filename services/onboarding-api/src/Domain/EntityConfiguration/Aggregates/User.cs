namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a user in the system (from Active Directory)
/// </summary>
public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string? Name { get; private set; }
    public DateTime? FirstLoginAt { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    private readonly List<UserPermission> _permissions = new();
    public IReadOnlyCollection<UserPermission> Permissions => _permissions.AsReadOnly();

    private readonly List<UserRoleAssignment> _roleAssignments = new();
    public IReadOnlyCollection<UserRoleAssignment> RoleAssignments => _roleAssignments.AsReadOnly();

    private User() { } // EF Core

    public User(
        string email,
        string? name = null)
    {
        Id = Guid.NewGuid();
        Email = email ?? throw new ArgumentNullException(nameof(email));
        Name = name;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(string? name = null)
    {
        if (name != null)
            Name = name;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RecordLogin()
    {
        var now = DateTime.UtcNow;
        if (FirstLoginAt == null)
            FirstLoginAt = now;
        LastLoginAt = now;
        UpdatedAt = now;
    }

    public void GrantPermission(string permissionName, string? resource = null, string? description = null)
    {
        if (_permissions.Any(p => p.PermissionName == permissionName && p.Resource == resource))
            return; // Already exists

        var permission = new UserPermission(Id, permissionName, resource, description);
        _permissions.Add(permission);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RevokePermission(Guid permissionId)
    {
        var permission = _permissions.FirstOrDefault(p => p.Id == permissionId);
        if (permission != null)
        {
            _permissions.Remove(permission);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void AssignRole(Guid roleId, string roleName, string roleDisplayName)
    {
        if (_roleAssignments.Any(r => r.RoleId == roleId && r.IsActive))
            return; // Already assigned

        var assignment = new UserRoleAssignment(Id, roleId, roleName, roleDisplayName);
        _roleAssignments.Add(assignment);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveRole(Guid userRoleId)
    {
        var assignment = _roleAssignments.FirstOrDefault(r => r.Id == userRoleId);
        if (assignment != null)
        {
            assignment.Deactivate();
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

/// <summary>
/// Represents a permission granted directly to a user
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
    public string? CreatedBy { get; private set; }

    private UserPermission() { } // EF Core

    public UserPermission(Guid userId, string permissionName, string? resource = null, string? description = null, string? createdBy = null)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        PermissionName = permissionName ?? throw new ArgumentNullException(nameof(permissionName));
        Resource = resource;
        Description = description;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        CreatedBy = createdBy;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

/// <summary>
/// Represents a role assignment to a user
/// </summary>
public class UserRoleAssignment
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid RoleId { get; private set; }
    public string RoleName { get; private set; } = string.Empty;
    public string RoleDisplayName { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private UserRoleAssignment() { } // EF Core

    public UserRoleAssignment(Guid userId, Guid roleId, string roleName, string roleDisplayName)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        RoleId = roleId;
        RoleName = roleName ?? throw new ArgumentNullException(nameof(roleName));
        RoleDisplayName = roleDisplayName ?? throw new ArgumentNullException(nameof(roleDisplayName));
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

