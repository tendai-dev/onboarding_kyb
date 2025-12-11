using MediatR;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public record CreateRequirementCommand(
    string Code,
    string DisplayName,
    string Description,
    string Type,
    string FieldType,
    string? ValidationRules = null,
    string? HelpText = null
) : IRequest<CreateRequirementResult>;

public record CreateRequirementResult(
    Guid Id,
    string Code,
    string DisplayName
);

public record UpdateRequirementCommand(
    Guid Id,
    string DisplayName,
    string Description,
    string? ValidationRules = null,
    string? HelpText = null,
    bool? IsActive = null
) : IRequest<UpdateRequirementResult>;

public record UpdateRequirementResult(
    Guid Id,
    string Code,
    string DisplayName
);

public record DeleteRequirementCommand(
    Guid Id
) : IRequest<bool>;

