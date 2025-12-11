using MediatR;

namespace OnboardingApi.Application.EntityConfiguration.Queries;

public record GetCountryProfileByCodeQuery(
    string CountryCode
) : IRequest<CountryProfileDto?>;

public record GetCountryProfileByIdQuery(
    Guid Id
) : IRequest<CountryProfileDto?>;

public record GetAllCountryProfilesQuery(
    bool IncludeInactive = false
) : IRequest<List<CountryProfileDto>>;

// DTOs
public record CountryProfileDto
{
    public Guid Id { get; init; }
    public string CountryCode { get; init; } = string.Empty;
    public string CountryName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public string? UpdatedBy { get; init; }
    public List<CountryEntityTypeOverrideDto> EntityTypeOverrides { get; init; } = new();
    public List<CountryTerminologyOverrideDto> TerminologyOverrides { get; init; } = new();
    public List<CountryFormBundleDto> FormBundles { get; init; } = new();
    public List<CountryFieldVisibilityRuleDto> FieldVisibilityRules { get; init; } = new();
    public List<CountryComplianceToggleDto> ComplianceToggles { get; init; } = new();
    public List<ConfigurationTagDto> Tags { get; init; } = new();
}

public record CountryEntityTypeOverrideDto
{
    public Guid Id { get; init; }
    public Guid EntityTypeId { get; init; }
    public bool IsEnabled { get; init; }
    public string? CustomDisplayName { get; init; }
    public string? CustomDescription { get; init; }
    public int DisplayOrder { get; init; }
}

public record CountryTerminologyOverrideDto
{
    public Guid Id { get; init; }
    public string TargetType { get; init; } = string.Empty;
    public string TargetCode { get; init; } = string.Empty;
    public string? OverrideDisplayName { get; init; }
    public string? OverrideDescription { get; init; }
    public string? OverrideHelpText { get; init; }
    public string? OverridePlaceholder { get; init; }
}

public record CountryFormBundleDto
{
    public Guid Id { get; init; }
    public Guid? EntityTypeId { get; init; }
    public string BundleName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public string FieldConfigurationJson { get; init; } = string.Empty;
}

public record CountryFieldVisibilityRuleDto
{
    public Guid Id { get; init; }
    public string TargetFieldCode { get; init; } = string.Empty;
    public Guid? EntityTypeId { get; init; }
    public string RuleExpression { get; init; } = string.Empty;
    public bool IsVisible { get; init; }
    public int Priority { get; init; }
    public bool IsActive { get; init; }
}

public record CountryComplianceToggleDto
{
    public Guid Id { get; init; }
    public string ComplianceCode { get; init; } = string.Empty;
    public string ComplianceName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsEnabled { get; init; }
    public string? ConfigurationJson { get; init; }
}

public record ConfigurationTagDto
{
    public Guid Id { get; init; }
    public string TagName { get; init; } = string.Empty;
    public string? TagValue { get; init; }
}

