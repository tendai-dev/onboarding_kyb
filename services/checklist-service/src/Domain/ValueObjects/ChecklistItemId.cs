namespace ChecklistService.Domain.ValueObjects;

public record ChecklistItemId(Guid Value)
{
    public static ChecklistItemId New() => new(Guid.NewGuid());
    public static ChecklistItemId From(Guid value) => new(value);
    public static ChecklistItemId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(ChecklistItemId id) => id.Value;
    public static implicit operator ChecklistItemId(Guid value) => new(value);
}
