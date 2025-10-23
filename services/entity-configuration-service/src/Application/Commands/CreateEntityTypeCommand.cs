using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record CreateEntityTypeCommand(
    string Code,
    string DisplayName,
    string Description
) : IRequest<CreateEntityTypeResult>;

public record CreateEntityTypeResult(
    Guid Id,
    string Code,
    string DisplayName
);


