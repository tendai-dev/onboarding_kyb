using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record DeleteRoleCommand(
    Guid RoleId
) : IRequest;

