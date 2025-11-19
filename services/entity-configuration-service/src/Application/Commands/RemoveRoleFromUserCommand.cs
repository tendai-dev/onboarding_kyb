using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record RemoveRoleFromUserCommand(
    Guid UserRoleId
) : IRequest;

