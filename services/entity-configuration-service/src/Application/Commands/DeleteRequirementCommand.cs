using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record DeleteRequirementCommand(Guid Id) : IRequest<bool>;
