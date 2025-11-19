using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class DeleteWizardConfigurationCommandHandler : IRequestHandler<DeleteWizardConfigurationCommand, bool>
{
    private readonly IWizardConfigurationRepository _repository;

    public DeleteWizardConfigurationCommandHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteWizardConfigurationCommand request, CancellationToken cancellationToken)
    {
        var wizardConfiguration = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (wizardConfiguration == null)
            return false;

        await _repository.DeleteAsync(wizardConfiguration, cancellationToken);
        return true;
    }
}

