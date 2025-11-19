using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record AssignRoleToUserCommand(
    Guid UserId,
    Guid RoleId,
    string? CreatedBy = null
) : IRequest<AssignRoleToUserResult>;

public record AssignRoleToUserResult(
    Guid UserRoleId,
    Guid UserId,
    Guid RoleId
);

