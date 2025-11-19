using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record UpdateRoleCommand(
    Guid RoleId,
    string DisplayName,
    string? Description = null
) : IRequest<UpdateRoleResult>;

public record UpdateRoleResult(
    Guid RoleId,
    string Name,
    string DisplayName
);

