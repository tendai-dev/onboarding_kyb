using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record AddPermissionToRoleCommand(
    Guid RoleId,
    string PermissionName,
    string? Resource = null
) : IRequest<AddPermissionToRoleResult>;

public record AddPermissionToRoleResult(
    Guid PermissionId,
    Guid RoleId,
    string PermissionName
);

