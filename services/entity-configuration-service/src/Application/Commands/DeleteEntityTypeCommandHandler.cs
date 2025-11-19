using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class DeleteEntityTypeCommandHandler : IRequestHandler<DeleteEntityTypeCommand, bool>
{
    private readonly IEntityTypeRepository _repository;
    private readonly IWizardConfigurationRepository _wizardConfigurationRepository;

    public DeleteEntityTypeCommandHandler(
        IEntityTypeRepository repository,
        IWizardConfigurationRepository wizardConfigurationRepository)
    {
        _repository = repository;
        _wizardConfigurationRepository = wizardConfigurationRepository;
    }

    public async Task<bool> Handle(DeleteEntityTypeCommand request, CancellationToken cancellationToken)
    {
        var entityType = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (entityType == null)
            return false;

        // Check if there are any wizard configurations referencing this entity type
        var wizardConfiguration = await _wizardConfigurationRepository.GetByEntityTypeIdAsync(request.Id, cancellationToken);
        if (wizardConfiguration != null)
        {
            throw new InvalidOperationException(
                $"Cannot delete entity type '{entityType.DisplayName}' because it is still referenced by a wizard configuration. " +
                $"Please delete or update the wizard configuration first.");
        }

        await _repository.DeleteAsync(entityType, cancellationToken);
        return true;
    }
}
