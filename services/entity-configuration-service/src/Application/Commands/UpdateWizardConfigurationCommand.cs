using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record UpdateWizardConfigurationCommand(
    Guid Id,
    bool IsActive,
    List<WizardStepDto> Steps
) : IRequest<UpdateWizardConfigurationResult>;

public record UpdateWizardConfigurationResult(
    Guid Id,
    Guid EntityTypeId,
    bool IsActive,
    DateTime UpdatedAt
);

