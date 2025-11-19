using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Commands;

public class CreateWizardConfigurationCommandHandler : IRequestHandler<CreateWizardConfigurationCommand, CreateWizardConfigurationResult>
{
    private readonly IWizardConfigurationRepository _wizardRepository;
    private readonly IEntityTypeRepository _entityTypeRepository;

    public CreateWizardConfigurationCommandHandler(
        IWizardConfigurationRepository wizardRepository,
        IEntityTypeRepository entityTypeRepository)
    {
        _wizardRepository = wizardRepository;
        _entityTypeRepository = entityTypeRepository;
    }

    public async Task<CreateWizardConfigurationResult> Handle(CreateWizardConfigurationCommand request, CancellationToken cancellationToken)
    {
        // Check if entity type exists
        var entityType = await _entityTypeRepository.GetByIdAsync(request.EntityTypeId, cancellationToken);
        if (entityType == null)
            throw new InvalidOperationException($"Entity type with ID '{request.EntityTypeId}' not found");

        // Check if wizard configuration already exists for this entity type
        var existing = await _wizardRepository.GetByEntityTypeIdAsync(request.EntityTypeId, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException($"Wizard configuration already exists for entity type '{entityType.DisplayName}'");

        var wizardConfiguration = new WizardConfiguration(request.EntityTypeId);
        
        if (!request.IsActive)
        {
            wizardConfiguration.Deactivate();
        }

        // Add steps
        foreach (var stepDto in request.Steps.OrderBy(s => s.StepNumber))
        {
            var step = new WizardStep(
                wizardConfiguration.Id,
                stepDto.Title,
                stepDto.Subtitle,
                stepDto.RequirementTypes,
                stepDto.ChecklistCategory,
                stepDto.StepNumber,
                stepDto.IsActive
            );
            wizardConfiguration.AddStep(step);
        }

        await _wizardRepository.AddAsync(wizardConfiguration, cancellationToken);

        return new CreateWizardConfigurationResult(
            wizardConfiguration.Id,
            wizardConfiguration.EntityTypeId,
            wizardConfiguration.IsActive,
            wizardConfiguration.CreatedAt
        );
    }
}

