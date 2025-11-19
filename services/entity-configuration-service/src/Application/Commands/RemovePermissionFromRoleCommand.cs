using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record RemovePermissionFromRoleCommand(
    Guid RoleId,
    Guid PermissionId
) : IRequest;

