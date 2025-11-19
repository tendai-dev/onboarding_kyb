using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetAllRolesQuery(
    bool IncludePermissions = false
) : IRequest<List<RoleDto>>;

public record RoleDto(
    Guid Id,
    string Name,
    string DisplayName,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<RolePermissionDto> Permissions
);

public record RolePermissionDto(
    Guid Id,
    string PermissionName,
    string? Resource,
    bool IsActive
);

