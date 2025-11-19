using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetAllRolesQueryHandler : IRequestHandler<GetAllRolesQuery, List<RoleDto>>
{
    private readonly IRoleRepository _repository;

    public GetAllRolesQueryHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<RoleDto>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _repository.GetAllAsync(includePermissions: request.IncludePermissions, cancellationToken: cancellationToken);

        return roles.Select(role => new RoleDto(
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
        )).ToList();
    }
}

