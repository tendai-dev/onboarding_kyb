namespace OnboardingApi.Domain.Checklist.ValueObjects;

public record ChecklistId(Guid Value)
{
    public static ChecklistId New() => new(Guid.NewGuid());
    public static ChecklistId From(Guid value) => new(value);
    public static ChecklistId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(ChecklistId id) => id.Value;
    public static implicit operator ChecklistId(Guid value) => new(value);
}

public record ChecklistItemId(Guid Value)
{
    public static ChecklistItemId New() => new(Guid.NewGuid());
    public static ChecklistItemId From(Guid value) => new(value);
    public static ChecklistItemId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(ChecklistItemId id) => id.Value;
    public static implicit operator ChecklistItemId(Guid value) => new(value);
}

public enum ChecklistType
{
    Individual,
    Corporate,
    Trust,
    Partnership
}

public enum ChecklistStatus
{
    InProgress,
    Completed,
    Cancelled
}

public enum ChecklistItemStatus
{
    Pending,
    Completed,
    Skipped
}

public enum ChecklistItemCategory
{
    Identity,
    Address,
    Financial,
    Compliance,
    Documentation,
    Verification,
    Risk,
    Other
}

public enum EntityType
{
    Individual = 1,
    Company = 2,
    Partnership = 3,
    Trust = 4
}

public enum RiskTier
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public class ChecklistItemTemplate
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChecklistItemCategory Category { get; set; }
    public bool IsRequired { get; set; }
    public int Order { get; set; }
}
