using MediatR;

namespace EntityConfigurationService.Application.Commands;

public record RevokePermissionCommand(
    Guid PermissionId
) : IRequest<RevokePermissionResult>;

public record RevokePermissionResult(
    bool Success
);

