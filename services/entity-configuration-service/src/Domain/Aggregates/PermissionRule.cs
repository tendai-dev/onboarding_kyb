namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// Permission rule definition - defines available permissions in the system
/// </summary>
public class PermissionRule
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Category { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Private constructor for EF Core
    private PermissionRule() { }

    /// <summary>
    /// Create a new permission rule
    /// </summary>
    public static PermissionRule Create(string name, string displayName, string? description = null, string? category = null)
    {
        var now = DateTime.UtcNow;
        return new PermissionRule
        {
            Id = Guid.NewGuid(),
            Name = name,
            DisplayName = displayName,
            Description = description,
            Category = category,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    /// <summary>
    /// Update permission rule
    /// </summary>
    public void Update(string displayName, string? description = null, string? category = null)
    {
        DisplayName = displayName;
        Description = description;
        Category = category;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Deactivate this rule
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Activate this rule
    /// </summary>
    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }
}

