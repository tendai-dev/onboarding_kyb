using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class CreateOrUpdateUserCommandHandler : IRequestHandler<CreateOrUpdateUserCommand, CreateOrUpdateUserResult>
{
    private readonly IUserRepository _repository;

    public CreateOrUpdateUserCommandHandler(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateOrUpdateUserResult> Handle(CreateOrUpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _repository.GetOrCreateByEmailAsync(request.Email, request.Name, cancellationToken);
        
        if (user == null)
        {
            throw new InvalidOperationException("Failed to create or update user");
        }

        return new CreateOrUpdateUserResult(
            user.Id,
            user.Email,
            user.Name,
            user.FirstLoginAt,
            user.LastLoginAt
        );
    }
}

