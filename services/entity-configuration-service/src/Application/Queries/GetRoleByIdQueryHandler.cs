using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetRoleByIdQueryHandler : IRequestHandler<GetRoleByIdQuery, RoleDto?>
{
    private readonly IRoleRepository _repository;

    public GetRoleByIdQueryHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task<RoleDto?> Handle(GetRoleByIdQuery request, CancellationToken cancellationToken)
    {
        var role = await _repository.GetByIdAsync(request.RoleId, includePermissions: request.IncludePermissions, cancellationToken: cancellationToken);

        if (role == null)
        {
            return null;
        }

        return new RoleDto(
            role.Id,
            role.Name,
            role.DisplayName,
            role.Description,
            role.IsActive,
            role.CreatedAt,
            role.UpdatedAt,
            role.Permissions
                .Where(p => p.IsActive)
                .Select(p => new RolePermissionDto(
                    p.Id,
                    p.PermissionName,
                    p.Resource,
                    p.IsActive
                ))
                .ToList()
        );
    }
}

