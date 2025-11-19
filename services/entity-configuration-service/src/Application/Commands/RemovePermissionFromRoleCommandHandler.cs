using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class RemovePermissionFromRoleCommandHandler : IRequestHandler<RemovePermissionFromRoleCommand>
{
    private readonly IRoleRepository _repository;

    public RemovePermissionFromRoleCommandHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(RemovePermissionFromRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _repository.GetByIdAsync(request.RoleId, includePermissions: true, cancellationToken: cancellationToken);
        
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID {request.RoleId} not found");
        }

        role.RemovePermission(request.PermissionId);
        await _repository.UpdateAsync(role, cancellationToken);
    }
}

