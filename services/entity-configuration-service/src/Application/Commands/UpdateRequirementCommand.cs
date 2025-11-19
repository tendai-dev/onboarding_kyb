using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record UpdateRequirementCommand(
    Guid Id,
    string DisplayName,
    string Description,
    string? ValidationRules,
    string? HelpText,
    bool IsActive
) : IRequest<UpdateRequirementResult>;

public record UpdateRequirementResult(
    Guid Id,
    string Code,
    string DisplayName,
    string Description,
    string Type,
    string FieldType,
    string? ValidationRules,
    string? HelpText,
    bool IsActive
);
