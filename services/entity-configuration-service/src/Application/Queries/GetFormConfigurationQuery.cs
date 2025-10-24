using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Queries;

/// <summary>
/// Query to get form configuration based on context (entity type, country, risk level)
/// </summary>
public record GetFormConfigurationQuery(
    string EntityType,
    string Country,
    string RiskLevel
);

public record FormConfigurationDto
{
    public Guid Id { get; init; }
    public string FormCode { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int Version { get; init; }
    public List<FormSectionDto> Sections { get; init; } = new();
    public List<ExternalDataSourceDto> DataSources { get; init; } = new();
}

public record FormSectionDto
{
    public string SectionCode { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int Order { get; init; }
    public VisibilityRuleDto? VisibilityRule { get; init; }
    public List<FormFieldDto> Fields { get; init; } = new();
}

public record FormFieldDto
{
    public string FieldCode { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string? Placeholder { get; init; }
    public string? HelpText { get; init; }
    public string Type { get; init; } = string.Empty;
    public int Order { get; init; }
    public bool IsRequired { get; init; }
    public RequirementRuleDto? RequirementRule { get; init; }
    public List<ValidationRuleDto> ValidationRules { get; init; } = new();
    public string? DataSourceCode { get; init; }
    public string? DataPath { get; init; }
    public VisibilityRuleDto? VisibilityRule { get; init; }
    public List<FieldOptionDto> Options { get; init; } = new();
}

public record VisibilityRuleDto
{
    public string Condition { get; init; } = string.Empty;
    public List<FieldConditionDto> FieldConditions { get; init; } = new();
}

public record FieldConditionDto
{
    public string FieldCode { get; init; } = string.Empty;
    public string Operator { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
}

public record RequirementRuleDto
{
    public string Condition { get; init; } = string.Empty;
    public List<FieldConditionDto> FieldConditions { get; init; } = new();
}

public record ValidationRuleDto
{
    public string Type { get; init; } = string.Empty;
    public string? Parameter { get; init; }
    public string ErrorMessage { get; init; } = string.Empty;
}

public record FieldOptionDto
{
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public bool IsDefault { get; init; }
}

public record ExternalDataSourceDto
{
    public string SourceCode { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string ApiEndpoint { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public List<DataMappingDto> Mappings { get; init; } = new();
}

public record DataMappingDto
{
    public string SourcePath { get; init; } = string.Empty;
    public string TargetFieldCode { get; init; } = string.Empty;
    public string? Transformation { get; init; }
}

/// <summary>
/// Query to fetch external company data
/// </summary>
public record FetchExternalCompanyDataQuery(
    string RegistryType,
    string CompanyNumber,
    string Country
);

/// <summary>
/// Query to search companies
/// </summary>
public record SearchCompaniesQuery(
    string RegistryType,
    string CompanyName,
    string Country
);

