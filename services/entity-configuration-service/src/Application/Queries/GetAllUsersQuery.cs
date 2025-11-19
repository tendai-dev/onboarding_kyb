using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetAllUsersQuery(
    bool IncludePermissions = false
) : IRequest<List<UserDto>>;

public record UserDto(
    Guid Id,
    string Email,
    string? Name,
    DateTime FirstLoginAt,
    DateTime LastLoginAt,
    DateTime CreatedAt,
    List<PermissionDto> Permissions,
    List<UserRoleDto> Roles
);

public record PermissionDto(
    Guid Id,
    string PermissionName,
    string? Resource,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    string? CreatedBy
);

public record UserRoleDto(
    Guid Id,
    Guid RoleId,
    string RoleName,
    string RoleDisplayName,
    bool IsActive,
    DateTime CreatedAt
);

