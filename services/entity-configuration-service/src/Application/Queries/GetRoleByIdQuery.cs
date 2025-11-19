using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetRoleByIdQuery(
    Guid RoleId,
    bool IncludePermissions = false
) : IRequest<RoleDto?>;

