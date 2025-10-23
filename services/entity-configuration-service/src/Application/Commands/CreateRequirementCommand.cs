using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record CreateRequirementCommand(
    string Code,
    string DisplayName,
    string Description,
    RequirementType Type,
    FieldType FieldType,
    string? ValidationRules = null,
    string? HelpText = null
) : IRequest<CreateRequirementResult>;

public record CreateRequirementResult(
    Guid Id,
    string Code,
    string DisplayName
);


