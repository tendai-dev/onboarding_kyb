using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record DeleteEntityTypeCommand(Guid Id) : IRequest<bool>;
