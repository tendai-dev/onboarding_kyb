using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetUserByEmailQuery(
    string Email
) : IRequest<UserDto?>;

