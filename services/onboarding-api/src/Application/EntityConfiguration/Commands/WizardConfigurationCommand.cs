using MediatR;
using System.Text.Json;

namespace OnboardingApi.Application.EntityConfiguration.Commands;

public record CreateWizardConfigurationCommand(
    Guid EntityTypeId,
    bool IsActive,
    List<CreateWizardStepCommand> Steps
) : IRequest<CreateWizardConfigurationResult>;

public record CreateWizardStepCommand(
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

public record UpdateWizardConfigurationCommand(
    Guid Id,
    bool IsActive,
    List<CreateWizardStepCommand> Steps
) : IRequest<UpdateWizardConfigurationResult>;

public record UpdateWizardConfigurationResult(
    Guid Id,
    Guid EntityTypeId,
    bool IsActive,
    DateTime UpdatedAt
);

public record DeleteWizardConfigurationCommand(
    Guid Id
) : IRequest<bool>;

