using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetUserByEmailQueryHandler : IRequestHandler<GetUserByEmailQuery, UserDto?>
{
    private readonly IUserRepository _repository;

    public GetUserByEmailQueryHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserDto?> Handle(GetUserByEmailQuery request, CancellationToken cancellationToken)
    {
        var user = await _repository.GetByEmailAsync(request.Email, cancellationToken);
        
        if (user == null)
        {
            return null;
        }

        return new UserDto(
            user.Id,
            user.Email,
            user.Name,
            user.FirstLoginAt,
            user.LastLoginAt,
            user.CreatedAt,
            user.Permissions.Select(p => new PermissionDto(
                p.Id,
                p.PermissionName,
                p.Resource,
                p.Description,
                p.IsActive,
                p.CreatedAt,
                p.CreatedBy
            )).ToList(),
            user.Roles
                .Where(ur => ur.IsActive)
                .Select(ur => new UserRoleDto(
                    ur.Id,
                    ur.RoleId,
                    ur.Role?.Name ?? "",
                    ur.Role?.DisplayName ?? "",
                    ur.IsActive,
                    ur.CreatedAt
                )).ToList()
        );
    }
}

