using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class DeleteRequirementCommandHandler : IRequestHandler<DeleteRequirementCommand, bool>
{
    private readonly IRequirementRepository _repository;

    public DeleteRequirementCommandHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteRequirementCommand request, CancellationToken cancellationToken)
    {
        var requirement = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (requirement == null)
            return false;

        await _repository.DeleteAsync(request.Id, cancellationToken);
        return true;
    }
}
