using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record CreateOrUpdateUserCommand(
    string Email,
    string? Name = null
) : IRequest<CreateOrUpdateUserResult>;

public record CreateOrUpdateUserResult(
    Guid Id,
    string Email,
    string? Name,
    DateTime FirstLoginAt,
    DateTime LastLoginAt
);

