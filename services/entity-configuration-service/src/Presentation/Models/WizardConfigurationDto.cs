using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Presentation.Models;

public record WizardConfigurationDto(
    Guid Id,
    Guid EntityTypeId,
    string? EntityTypeDisplayName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<WizardStepDto> Steps
)
{
    public static WizardConfigurationDto FromDomain(WizardConfiguration wizardConfiguration)
    {
        return new WizardConfigurationDto(
            wizardConfiguration.Id,
            wizardConfiguration.EntityTypeId,
            wizardConfiguration.EntityType?.DisplayName,
            wizardConfiguration.IsActive,
            wizardConfiguration.CreatedAt,
            wizardConfiguration.UpdatedAt,
            wizardConfiguration.Steps.Select(WizardStepDto.FromDomain).ToList()
        );
    }
}

public record WizardStepDto(
    Guid Id,
    string Title,
    string Subtitle,
    List<string> RequirementTypes,
    string ChecklistCategory,
    int StepNumber,
    bool IsActive
)
{
    public static WizardStepDto FromDomain(WizardStep step)
    {
        return new WizardStepDto(
            step.Id,
            step.Title,
            step.Subtitle,
            step.RequirementTypes.Select(rt => rt.RequirementType).ToList(),
            step.ChecklistCategory,
            step.StepNumber,
            step.IsActive
        );
    }
}

public record CreateWizardConfigurationRequest(
    Guid EntityTypeId,
    bool IsActive,
    List<CreateWizardStepRequest> Steps
);

public record CreateWizardStepRequest(
    string Title,
    string Subtitle,
    List<string> RequirementTypes,
    string ChecklistCategory,
    int StepNumber,
    bool IsActive
);

public record UpdateWizardConfigurationRequest(
    bool IsActive,
    List<CreateWizardStepRequest> Steps
);

