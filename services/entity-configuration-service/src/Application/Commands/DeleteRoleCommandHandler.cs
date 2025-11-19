using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class DeleteRoleCommandHandler : IRequestHandler<DeleteRoleCommand>
{
    private readonly IRoleRepository _repository;

    public DeleteRoleCommandHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _repository.GetByIdAsync(request.RoleId, includeUserRoles: true, cancellationToken: cancellationToken);
        
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID {request.RoleId} not found");
        }

        // Check if role is assigned to any users
        if (role.UserRoles.Any(ur => ur.IsActive))
        {
            throw new InvalidOperationException($"Cannot delete role '{role.DisplayName}' because it is assigned to one or more users");
        }

        await _repository.DeleteAsync(request.RoleId, cancellationToken);
    }
}

