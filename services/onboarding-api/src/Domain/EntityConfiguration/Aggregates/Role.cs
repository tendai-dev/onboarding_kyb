namespace OnboardingApi.Domain.EntityConfiguration.Aggregates;

/// <summary>
/// Represents a role in the system (from Active Directory)
/// </summary>
public class Role
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } // e.g., "due-diligence-compliance-specialist"
    public string DisplayName { get; private set; } // e.g., "Due Diligence Compliance Specialist"
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property for permissions
    private readonly List<RolePermission> _permissions = new();
    public IReadOnlyCollection<RolePermission> Permissions => _permissions.AsReadOnly();

    private Role() { } // EF Core

    public Role(
        string name,
        string displayName,
        string? description = null)
    {
        Id = Guid.NewGuid();
        Name = name ?? throw new ArgumentNullException(nameof(name));
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(string displayName, string? description = null)
    {
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddPermission(string permissionName, string? resource = null)
    {
        if (_permissions.Any(p => p.PermissionName == permissionName && p.Resource == resource))
            return; // Already exists

        var permission = new RolePermission(Id, permissionName, resource);
        _permissions.Add(permission);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemovePermission(Guid permissionId)
    {
        var permission = _permissions.FirstOrDefault(p => p.Id == permissionId);
        if (permission != null)
        {
            _permissions.Remove(permission);
            UpdatedAt = DateTime.UtcNow;
        }
    }
}

/// <summary>
/// Represents a permission assigned to a role
/// </summary>
public class RolePermission
{
    public Guid Id { get; private set; }
    public Guid RoleId { get; private set; }
    public string PermissionName { get; private set; } = string.Empty;
    public string? Resource { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private RolePermission() { } // EF Core

    public RolePermission(Guid roleId, string permissionName, string? resource = null)
    {
        Id = Guid.NewGuid();
        RoleId = roleId;
        PermissionName = permissionName ?? throw new ArgumentNullException(nameof(permissionName));
        Resource = resource;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

