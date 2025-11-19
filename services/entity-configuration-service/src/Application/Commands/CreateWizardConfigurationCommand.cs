using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record CreateWizardConfigurationCommand(
    Guid EntityTypeId,
    bool IsActive,
    List<WizardStepDto> Steps
) : IRequest<CreateWizardConfigurationResult>;

public record WizardStepDto(
    string Title,
    string Subtitle,
    List<string> RequirementTypes,
    string ChecklistCategory,
    int StepNumber,
    bool IsActive
);

public record CreateWizardConfigurationResult(
    Guid Id,
    Guid EntityTypeId,
    bool IsActive,
    DateTime CreatedAt
);

