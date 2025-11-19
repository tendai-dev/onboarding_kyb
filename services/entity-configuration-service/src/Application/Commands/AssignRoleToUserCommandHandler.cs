using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class AssignRoleToUserCommandHandler : IRequestHandler<AssignRoleToUserCommand, AssignRoleToUserResult>
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;

    public AssignRoleToUserCommandHandler(IUserRepository userRepository, IRoleRepository roleRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

    public async Task<AssignRoleToUserResult> Handle(AssignRoleToUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, includePermissions: true, cancellationToken: cancellationToken);
        
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID {request.UserId} not found");
        }

        var role = await _roleRepository.GetByIdAsync(request.RoleId, cancellationToken: cancellationToken);
        
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID {request.RoleId} not found");
        }

        if (!role.IsActive)
        {
            throw new InvalidOperationException($"Cannot assign inactive role '{role.DisplayName}' to user");
        }

        user.AddRole(request.RoleId, request.CreatedBy);
        await _userRepository.UpdateAsync(user, cancellationToken);

        var userRole = user.Roles.FirstOrDefault(ur => ur.RoleId == request.RoleId);

        if (userRole == null)
        {
            throw new InvalidOperationException("Failed to assign role to user");
        }

        return new AssignRoleToUserResult(
            userRole.Id,
            user.Id,
            role.Id
        );
    }
}

