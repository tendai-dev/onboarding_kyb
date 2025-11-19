using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Presentation.Models;

public record RequirementDto(
    Guid Id,
    string Code,
    string DisplayName,
    string Description,
    string Type,
    string FieldType,
    string? ValidationRules,
    string? HelpText,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<RequirementOptionDto>? Options
)
{
    public static RequirementDto FromDomain(Requirement requirement)
    {
        return new RequirementDto(
            requirement.Id,
            requirement.Code,
            requirement.DisplayName,
            requirement.Description,
            requirement.Type.ToString(),
            requirement.FieldType.ToString(),
            requirement.ValidationRules,
            requirement.HelpText,
            requirement.IsActive,
            requirement.CreatedAt,
            requirement.UpdatedAt,
            requirement.Options?.Select(RequirementOptionDto.FromDomain).ToList()
        );
    }
}

public record RequirementOptionDto(
    Guid Id,
    string Value,
    string DisplayText,
    int DisplayOrder
)
{
    public static RequirementOptionDto FromDomain(RequirementOption option)
    {
        return new RequirementOptionDto(
            option.Id,
            option.Value,
            option.DisplayText,
            option.DisplayOrder
        );
    }
}

public record CreateRequirementRequest(
    string Code,
    string DisplayName,
    string Description,
    RequirementType Type,
    FieldType FieldType,
    string? ValidationRules = null,
    string? HelpText = null
);

public record UpdateRequirementRequest(
    string DisplayName,
    string Description,
    string? ValidationRules,
    string? HelpText,
    bool IsActive
);
