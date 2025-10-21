namespace ChecklistService.Domain.ValueObjects;

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

public class ChecklistItemTemplate
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChecklistItemCategory Category { get; set; }
    public bool IsRequired { get; set; }
    public int Order { get; set; }
}
