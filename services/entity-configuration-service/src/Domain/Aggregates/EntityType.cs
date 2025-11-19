namespace EntityConfigurationService.Domain.Aggregates;

/// <summary>
/// Represents a type of legal entity (e.g., Private Company, Limited Liability Company, NGO)
/// </summary>
public class EntityType
{
    public Guid Id { get; private set; }
    public string Code { get; private set; } // e.g., "PRIVATE_COMPANY", "LLC", "NGO"
    public string DisplayName { get; private set; } // e.g., "Private Company / Limited Liability Company"
    public string Description { get; private set; }
    public string? Icon { get; private set; } // Icon name from react-icons (e.g., "FiBriefcase", "FiHome")
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    
    // Navigation property
    private readonly List<EntityTypeRequirement> _requirements = new();
    public IReadOnlyCollection<EntityTypeRequirement> Requirements => _requirements.AsReadOnly();

    private EntityType() { } // EF Core

    public EntityType(
        string code,
        string displayName,
        string description,
        string? icon = null)
    {
        Id = Guid.NewGuid();
        Code = code ?? throw new ArgumentNullException(nameof(code));
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Icon = icon;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(string displayName, string description, string? icon = null)
    {
        DisplayName = displayName ?? throw new ArgumentNullException(nameof(displayName));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Icon = icon;
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

    public void AddRequirement(Requirement requirement, bool isRequired, int displayOrder)
    {
        if (_requirements.Any(r => r.RequirementId == requirement.Id))
            throw new InvalidOperationException("Requirement already added to this entity type");

        var entityTypeRequirement = new EntityTypeRequirement(
            Id,
            requirement.Id,
            isRequired,
            displayOrder
        );
        
        _requirements.Add(entityTypeRequirement);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveRequirement(Guid requirementId)
    {
        var requirement = _requirements.FirstOrDefault(r => r.RequirementId == requirementId);
        if (requirement != null)
        {
            _requirements.Remove(requirement);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void UpdateRequirement(Guid requirementId, bool isRequired, int displayOrder)
    {
        var requirement = _requirements.FirstOrDefault(r => r.RequirementId == requirementId);
        if (requirement == null)
            throw new InvalidOperationException("Requirement not found in this entity type");

        requirement.Update(isRequired, displayOrder);
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Join entity linking EntityType to Requirement with additional metadata
/// </summary>
public class EntityTypeRequirement
{
    public Guid Id { get; private set; }
    public Guid EntityTypeId { get; private set; }
    public Guid RequirementId { get; private set; }
    public bool IsRequired { get; private set; }
    public int DisplayOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    public EntityType EntityType { get; private set; } = null!;
    public Requirement Requirement { get; private set; } = null!;

    private EntityTypeRequirement() { } // EF Core

    public EntityTypeRequirement(
        Guid entityTypeId,
        Guid requirementId,
        bool isRequired,
        int displayOrder)
    {
        Id = Guid.NewGuid();
        EntityTypeId = entityTypeId;
        RequirementId = requirementId;
        IsRequired = isRequired;
        DisplayOrder = displayOrder;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(bool isRequired, int displayOrder)
    {
        IsRequired = isRequired;
        DisplayOrder = displayOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}

