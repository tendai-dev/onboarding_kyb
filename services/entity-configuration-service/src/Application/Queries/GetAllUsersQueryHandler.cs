using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, List<UserDto>>
{
    private readonly IUserRepository _repository;

    public GetAllUsersQueryHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _repository.GetAllAsync(request.IncludePermissions, cancellationToken);
        
        return users.Select(u => new UserDto(
            u.Id,
            u.Email,
            u.Name,
            u.FirstLoginAt,
            u.LastLoginAt,
            u.CreatedAt,
            u.Permissions.Select(p => new PermissionDto(
                p.Id,
                p.PermissionName,
                p.Resource,
                p.Description,
                p.IsActive,
                p.CreatedAt,
                p.CreatedBy
            )).ToList(),
            u.Roles
                .Where(ur => ur.IsActive)
                .Select(ur => new UserRoleDto(
                    ur.Id,
                    ur.RoleId,
                    ur.Role?.Name ?? "",
                    ur.Role?.DisplayName ?? "",
                    ur.IsActive,
                    ur.CreatedAt
                )).ToList()
        )).ToList();
    }
}

