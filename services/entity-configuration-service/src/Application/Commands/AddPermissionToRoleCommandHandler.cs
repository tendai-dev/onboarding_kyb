using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class AddPermissionToRoleCommandHandler : IRequestHandler<AddPermissionToRoleCommand, AddPermissionToRoleResult>
{
    private readonly IRoleRepository _repository;

    public AddPermissionToRoleCommandHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task<AddPermissionToRoleResult> Handle(AddPermissionToRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _repository.GetByIdAsync(request.RoleId, includePermissions: true, cancellationToken: cancellationToken);
        
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID {request.RoleId} not found");
        }

        role.AddPermission(request.PermissionName, request.Resource);
        await _repository.UpdateAsync(role, cancellationToken);

        var permission = role.Permissions.FirstOrDefault(p => 
            p.PermissionName == request.PermissionName && 
            p.Resource == request.Resource);

        if (permission == null)
        {
            throw new InvalidOperationException("Failed to create permission");
        }

        return new AddPermissionToRoleResult(
            permission.Id,
            role.Id,
            permission.PermissionName
        );
    }
}

