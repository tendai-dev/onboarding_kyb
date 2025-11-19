using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record GrantPermissionCommand(
    Guid UserId,
    string PermissionName,
    string? Resource = null,
    string? Description = null,
    string? CreatedBy = null
) : IRequest<GrantPermissionResult>;

public record GrantPermissionResult(
    Guid PermissionId,
    Guid UserId,
    string PermissionName,
    string? Resource
);

