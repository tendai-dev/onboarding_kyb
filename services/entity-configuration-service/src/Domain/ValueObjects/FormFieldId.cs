namespace EntityConfigurationService.Domain.ValueObjects;

public record FormFieldId(Guid Value)
{
    public static FormFieldId New() => new(Guid.NewGuid());
    public static FormFieldId From(Guid value) => new(value);
}
