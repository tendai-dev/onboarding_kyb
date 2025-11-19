using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class GrantPermissionCommandHandler : IRequestHandler<GrantPermissionCommand, GrantPermissionResult>
{
    private readonly IUserRepository _repository;

    public GrantPermissionCommandHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<GrantPermissionResult> Handle(GrantPermissionCommand request, CancellationToken cancellationToken)
    {
        var user = await _repository.GetByIdAsync(request.UserId, includePermissions: true, cancellationToken);
        
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID {request.UserId} not found");
        }

        try
        {
            user.AddPermission(request.PermissionName, request.Resource, request.Description);
            await _repository.UpdateAsync(user, cancellationToken);

            var permission = user.Permissions.FirstOrDefault(p => 
                p.PermissionName == request.PermissionName && 
                p.Resource == request.Resource);

            if (permission == null)
            {
                throw new InvalidOperationException("Failed to create permission");
            }

            return new GrantPermissionResult(
                permission.Id,
                user.Id,
                permission.PermissionName,
                permission.Resource
            );
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to grant permission: {ex.Message}", ex);
        }
    }
}

