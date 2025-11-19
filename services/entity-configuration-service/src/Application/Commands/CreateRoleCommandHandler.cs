using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, CreateRoleResult>
{
    private readonly IRoleRepository _repository;

    public CreateRoleCommandHandler(IRoleRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateRoleResult> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        // Check if role with same name already exists
        var existingRole = await _repository.GetByNameAsync(request.Name, cancellationToken: cancellationToken);
        if (existingRole != null)
        {
            throw new InvalidOperationException($"Role with name '{request.Name}' already exists");
        }

        var role = Role.Create(request.Name, request.DisplayName, request.Description, request.CreatedBy);
        await _repository.CreateAsync(role, cancellationToken);

        return new CreateRoleResult(
            role.Id,
            role.Name,
            role.DisplayName
        );
    }
}

