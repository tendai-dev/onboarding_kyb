using MediatR;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

// Country Profile Commands
public record CreateCountryProfileCommand(
    string CountryCode,
    string CountryName,
    string? Description = null,
    string CreatedBy = "system"
) : IRequest<CountryProfileResult>;

public record UpdateCountryProfileCommand(
    Guid Id,
    string CountryName,
    string? Description = null,
    string? UpdatedBy = null
) : IRequest<CountryProfileResult>;

public record DeleteCountryProfileCommand(
    Guid Id
) : IRequest<bool>;

public record ActivateCountryProfileCommand(
    Guid Id
) : IRequest<bool>;

public record DeactivateCountryProfileCommand(
    Guid Id
) : IRequest<bool>;

// Entity Type Override Commands
public record AddEntityTypeOverrideCommand(
    Guid CountryProfileId,
    Guid EntityTypeId,
    bool IsEnabled = true,
    string? CustomDisplayName = null,
    string? CustomDescription = null,
    int DisplayOrder = 0
) : IRequest<bool>;

public record UpdateEntityTypeOverrideCommand(
    Guid CountryProfileId,
    Guid EntityTypeId,
    bool IsEnabled,
    string? CustomDisplayName = null,
    string? CustomDescription = null,
    int DisplayOrder = 0
) : IRequest<bool>;

public record RemoveEntityTypeOverrideCommand(
    Guid CountryProfileId,
    Guid EntityTypeId
) : IRequest<bool>;

// Terminology Override Commands
public record AddTerminologyOverrideCommand(
    Guid CountryProfileId,
    string TargetType,
    string TargetCode,
    string? OverrideDisplayName = null,
    string? OverrideDescription = null,
    string? OverrideHelpText = null,
    string? OverridePlaceholder = null
) : IRequest<Guid>;

public record UpdateTerminologyOverrideCommand(
    Guid OverrideId,
    string? OverrideDisplayName = null,
    string? OverrideDescription = null,
    string? OverrideHelpText = null,
    string? OverridePlaceholder = null
) : IRequest<bool>;

public record RemoveTerminologyOverrideCommand(
    Guid OverrideId
) : IRequest<bool>;

// Form Bundle Commands
public record CreateFormBundleCommand(
    Guid CountryProfileId,
    string BundleName,
    string FieldConfigurationJson,
    Guid? EntityTypeId = null,
    string? Description = null
) : IRequest<FormBundleResult>;

public record UpdateFormBundleCommand(
    Guid BundleId,
    string BundleName,
    string FieldConfigurationJson,
    Guid? EntityTypeId = null,
    string? Description = null
) : IRequest<FormBundleResult>;

public record DeleteFormBundleCommand(
    Guid BundleId
) : IRequest<bool>;

// Field Visibility Rule Commands
public record AddFieldVisibilityRuleCommand(
    Guid CountryProfileId,
    string TargetFieldCode,
    string RuleExpression,
    bool IsVisible = true,
    Guid? EntityTypeId = null,
    int Priority = 0
) : IRequest<Guid>;

public record UpdateFieldVisibilityRuleCommand(
    Guid RuleId,
    string RuleExpression,
    bool IsVisible = true,
    Guid? EntityTypeId = null,
    int Priority = 0
) : IRequest<bool>;

public record RemoveFieldVisibilityRuleCommand(
    Guid RuleId
) : IRequest<bool>;

// Compliance Toggle Commands
public record AddComplianceToggleCommand(
    Guid CountryProfileId,
    string ComplianceCode,
    string ComplianceName,
    bool IsEnabled = true,
    string? Description = null,
    string? ConfigurationJson = null
) : IRequest<bool>;

public record UpdateComplianceToggleCommand(
    Guid CountryProfileId,
    string ComplianceCode,
    string ComplianceName,
    bool IsEnabled,
    string? Description = null,
    string? ConfigurationJson = null
) : IRequest<bool>;

public record RemoveComplianceToggleCommand(
    Guid CountryProfileId,
    string ComplianceCode
) : IRequest<bool>;

// Tag Commands
public record AddTagCommand(
    Guid CountryProfileId,
    string TagName,
    string? TagValue = null
) : IRequest<bool>;

public record RemoveTagCommand(
    Guid CountryProfileId,
    string TagName,
    string? TagValue = null
) : IRequest<bool>;

// Result DTOs
public record CountryProfileResult(
    Guid Id,
    string CountryCode,
    string CountryName,
    string? Description,
    bool IsActive
);

public record FormBundleResult(
    Guid Id,
    string BundleName,
    Guid? EntityTypeId,
    bool IsActive
);

