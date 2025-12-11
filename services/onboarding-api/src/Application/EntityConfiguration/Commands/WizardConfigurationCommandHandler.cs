using MediatR;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using System.Text.Json;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public class CreateWizardConfigurationCommandHandler : IRequestHandler<CreateWizardConfigurationCommand, CreateWizardConfigurationResult>
{
    private readonly IWizardConfigurationRepository _repository;
    private readonly IEntityTypeRepository _entityTypeRepository;

    public CreateWizardConfigurationCommandHandler(
        IWizardConfigurationRepository repository,
        IEntityTypeRepository entityTypeRepository)
    {
        _repository = repository;
        _entityTypeRepository = entityTypeRepository;
    }

    public async Task<CreateWizardConfigurationResult> Handle(CreateWizardConfigurationCommand request, CancellationToken cancellationToken)
    {
        // Check if entity type exists
        var entityType = await _entityTypeRepository.GetByIdAsync(request.EntityTypeId, cancellationToken);
        if (entityType == null)
            throw new InvalidOperationException($"Entity type with ID '{request.EntityTypeId}' not found");

        // Check if wizard configuration already exists for this entity type
        var existing = await _repository.GetByEntityTypeIdAsync(request.EntityTypeId, cancellationToken);
        if (existing != null)
            throw new InvalidOperationException($"Wizard configuration already exists for entity type '{entityType.DisplayName}'");

        var wizardConfig = new WizardConfiguration(request.EntityTypeId);
        
        if (!request.IsActive)
            wizardConfig.Deactivate();

        // Create steps
        var steps = new List<WizardStep>();
        foreach (var stepCommand in request.Steps.OrderBy(s => s.StepNumber))
        {
            var requirementTypesJson = JsonSerializer.Serialize(stepCommand.RequirementTypes ?? new List<string>());
            var step = new WizardStep(
                wizardConfig.Id,
                stepCommand.Title,
                stepCommand.Subtitle,
                requirementTypesJson,
                stepCommand.ChecklistCategory ?? string.Empty,
                stepCommand.StepNumber
            );
            
            if (!stepCommand.IsActive)
                step.Deactivate();
            
            steps.Add(step);
        }

        wizardConfig.UpdateSteps(steps);

        await _repository.AddAsync(wizardConfig, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CreateWizardConfigurationResult(
            wizardConfig.Id,
            wizardConfig.EntityTypeId,
            wizardConfig.IsActive,
            wizardConfig.CreatedAt
        );
    }
}

public class UpdateWizardConfigurationCommandHandler : IRequestHandler<UpdateWizardConfigurationCommand, UpdateWizardConfigurationResult>
{
    private readonly IWizardConfigurationRepository _repository;

    public UpdateWizardConfigurationCommandHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateWizardConfigurationResult> Handle(UpdateWizardConfigurationCommand request, CancellationToken cancellationToken)
    {
        var wizardConfig = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (wizardConfig == null)
            throw new InvalidOperationException($"Wizard configuration with ID '{request.Id}' not found");

        // Update active status
        if (request.IsActive)
            wizardConfig.Activate();
        else
            wizardConfig.Deactivate();

        // Update steps
        var steps = new List<WizardStep>();
        foreach (var stepCommand in request.Steps.OrderBy(s => s.StepNumber))
        {
            var requirementTypesJson = JsonSerializer.Serialize(stepCommand.RequirementTypes ?? new List<string>());
            var step = new WizardStep(
                wizardConfig.Id,
                stepCommand.Title,
                stepCommand.Subtitle,
                requirementTypesJson,
                stepCommand.ChecklistCategory ?? string.Empty,
                stepCommand.StepNumber
            );
            
            if (!stepCommand.IsActive)
                step.Deactivate();
            
            steps.Add(step);
        }

        wizardConfig.UpdateSteps(steps);

        await _repository.UpdateAsync(wizardConfig, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new UpdateWizardConfigurationResult(
            wizardConfig.Id,
            wizardConfig.EntityTypeId,
            wizardConfig.IsActive,
            wizardConfig.UpdatedAt
        );
    }
}

public class DeleteWizardConfigurationCommandHandler : IRequestHandler<DeleteWizardConfigurationCommand, bool>
{
    private readonly IWizardConfigurationRepository _repository;

    public DeleteWizardConfigurationCommandHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(DeleteWizardConfigurationCommand request, CancellationToken cancellationToken)
    {
        var wizardConfig = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (wizardConfig == null)
            return false;

        await _repository.DeleteAsync(wizardConfig, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

