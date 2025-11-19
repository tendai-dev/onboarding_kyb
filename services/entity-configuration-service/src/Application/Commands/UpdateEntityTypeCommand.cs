using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record UpdateEntityTypeCommand(
    Guid Id,
    string DisplayName,
    string Description,
    bool IsActive,
    string? Icon = null
) : IRequest<UpdateEntityTypeResult>;

public record UpdateEntityTypeResult(
    Guid Id,
    string Code,
    string DisplayName,
    string Description,
    bool IsActive
);
