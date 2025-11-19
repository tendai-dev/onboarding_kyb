using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class RevokePermissionCommandHandler : IRequestHandler<RevokePermissionCommand, RevokePermissionResult>
{
    private readonly IUserRepository _userRepository;

    public RevokePermissionCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<RevokePermissionResult> Handle(RevokePermissionCommand request, CancellationToken cancellationToken)
    {
        // Get all users with permissions to find the one with this permission
        var users = await _userRepository.GetAllAsync(includePermissions: true, cancellationToken);
        
        var user = users.FirstOrDefault(u => u.Permissions.Any(p => p.Id == request.PermissionId));
        
        if (user == null)
        {
            throw new InvalidOperationException($"Permission with ID {request.PermissionId} not found");
        }

        var permission = user.Permissions.FirstOrDefault(p => p.Id == request.PermissionId);
        if (permission == null)
        {
            throw new InvalidOperationException($"Permission with ID {request.PermissionId} not found");
        }

        permission.Deactivate();
        await _userRepository.UpdateAsync(user, cancellationToken);

        return new RevokePermissionResult(true);
    }
}

