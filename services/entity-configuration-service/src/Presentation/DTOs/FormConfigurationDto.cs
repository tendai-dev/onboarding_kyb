namespace EntityConfigurationService.Presentation.DTOs;

public class FormConfigurationDto
{
    public Guid Id { get; set; }
    public string FormCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Version { get; set; }
    public List<FormSectionDto> Sections { get; set; } = new();
    public List<ExternalDataSourceDto> DataSources { get; set; } = new();
}

public class FormSectionDto
{
    public string SectionCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<FormFieldDto> Fields { get; set; } = new();
    public VisibilityRuleDto? VisibilityRule { get; set; }
    public RequirementRuleDto? RequirementRule { get; set; }
}

public class FormFieldDto
{
    public string FieldCode { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Placeholder { get; set; } = string.Empty;
    public string HelpText { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsRequired { get; set; }
    public string? DataPath { get; set; }
    public string? DataSourceCode { get; set; }
    public List<ValidationRuleDto> ValidationRules { get; set; } = new();
    public List<FieldOptionDto> Options { get; set; } = new();
}

public class ValidationRuleDto
{
    public string Type { get; set; } = string.Empty;
    public string Parameter { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}

public class FieldOptionDto
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class VisibilityRuleDto
{
    public string Condition { get; set; } = string.Empty;
    public List<FieldConditionDto> FieldConditions { get; set; } = new();
}

public class RequirementRuleDto
{
    public string Condition { get; set; } = string.Empty;
}

public class FieldConditionDto
{
    public string FieldCode { get; set; } = string.Empty;
    public string Operator { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ExternalDataSourceDto
{
    public string SourceCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ApiEndpoint { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<DataMappingDto> Mappings { get; set; } = new();
}

public class DataMappingDto
{
    public string SourcePath { get; set; } = string.Empty;
    public string TargetFieldCode { get; set; } = string.Empty;
}
