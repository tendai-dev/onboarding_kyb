using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class RemoveRoleFromUserCommandHandler : IRequestHandler<RemoveRoleFromUserCommand>
{
    private readonly IUserRepository _repository;

    public RemoveRoleFromUserCommandHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(RemoveRoleFromUserCommand request, CancellationToken cancellationToken)
    {
        // We need to find the user that has this UserRole
        // Since we don't have a direct lookup, we'll need to search through users
        // For better performance, we could add a UserRole repository, but for now this works
        var users = await _repository.GetAllAsync(includePermissions: true, cancellationToken: cancellationToken);
        var user = users.FirstOrDefault(u => u.Roles.Any(ur => ur.Id == request.UserRoleId));
        
        if (user == null)
        {
            throw new InvalidOperationException($"User role with ID {request.UserRoleId} not found");
        }

        user.RemoveRole(request.UserRoleId);
        await _repository.UpdateAsync(user, cancellationToken);
    }
}

