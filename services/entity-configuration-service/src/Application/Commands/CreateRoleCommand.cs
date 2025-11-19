using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record CreateRoleCommand(
    string Name,
    string DisplayName,
    string? Description = null,
    string? CreatedBy = null
) : IRequest<CreateRoleResult>;

public record CreateRoleResult(
    Guid RoleId,
    string Name,
    string DisplayName
);

