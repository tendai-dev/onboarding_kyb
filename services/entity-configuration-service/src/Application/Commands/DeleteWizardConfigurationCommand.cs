using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record DeleteWizardConfigurationCommand(Guid Id) : IRequest<bool>;

