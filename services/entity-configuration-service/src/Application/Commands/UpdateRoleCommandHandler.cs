using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, UpdateRoleResult>
{
    private readonly IRoleRepository _repository;

    public UpdateRoleCommandHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateRoleResult> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _repository.GetByIdAsync(request.RoleId, cancellationToken: cancellationToken);
        
        if (role == null)
        {
            throw new InvalidOperationException($"Role with ID {request.RoleId} not found");
        }

        role.Update(request.DisplayName, request.Description);
        await _repository.UpdateAsync(role, cancellationToken);

        return new UpdateRoleResult(
            role.Id,
            role.Name,
            role.DisplayName
        );
    }
}

