using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class UpdateWizardConfigurationCommandHandler : IRequestHandler<UpdateWizardConfigurationCommand, UpdateWizardConfigurationResult>
{
    private readonly IWizardConfigurationRepository _repository;

    public UpdateWizardConfigurationCommandHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateWizardConfigurationResult> Handle(UpdateWizardConfigurationCommand request, CancellationToken cancellationToken)
    {
        var wizardConfiguration = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (wizardConfiguration == null)
            throw new InvalidOperationException($"Wizard configuration with ID '{request.Id}' not found");

        // Update active status
        if (request.IsActive && !wizardConfiguration.IsActive)
        {
            wizardConfiguration.Activate();
        }
        else if (!request.IsActive && wizardConfiguration.IsActive)
        {
            wizardConfiguration.Deactivate();
        }

        // Replace all steps
        var newSteps = request.Steps.OrderBy(s => s.StepNumber).Select(stepDto =>
            new WizardStep(
                wizardConfiguration.Id,
                stepDto.Title,
                stepDto.Subtitle,
                stepDto.RequirementTypes,
                stepDto.ChecklistCategory,
                stepDto.StepNumber,
                stepDto.IsActive
            )
        ).ToList();

        wizardConfiguration.ReplaceSteps(newSteps);

        await _repository.UpdateAsync(wizardConfiguration, cancellationToken);

        return new UpdateWizardConfigurationResult(
            wizardConfiguration.Id,
            wizardConfiguration.EntityTypeId,
            wizardConfiguration.IsActive,
            wizardConfiguration.UpdatedAt
        );
    }
}

