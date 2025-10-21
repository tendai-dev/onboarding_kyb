namespace ChecklistService.Domain.ValueObjects;

public record ChecklistId(Guid Value)
{
    public static ChecklistId New() => new(Guid.NewGuid());
    public static ChecklistId From(Guid value) => new(value);
    public static ChecklistId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(ChecklistId id) => id.Value;
    public static implicit operator ChecklistId(Guid value) => new(value);
}
