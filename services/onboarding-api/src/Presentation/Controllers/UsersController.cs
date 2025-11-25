using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Users management controller - Active Directory based users from database
/// </summary>
[ApiController]
[Route("api/v1/users")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;
    private readonly IUserRepository _userRepository;

    public UsersController(ILogger<UsersController> logger, IUserRepository userRepository)
    {
        _logger = logger;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers([FromQuery] bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        try
        {
            var users = await _userRepository.GetAllAsync(includeInactive: false, cancellationToken);
            
            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id.ToString(),
                Email = u.Email,
                Name = u.Name,
                FirstLoginAt = u.FirstLoginAt?.ToString("o") ?? string.Empty,
                LastLoginAt = u.LastLoginAt?.ToString("o") ?? string.Empty,
                CreatedAt = u.CreatedAt.ToString("o"),
                Permissions = includePermissions 
                    ? u.Permissions.Where(p => p.IsActive).Select(p => new PermissionDto
                    {
                        Id = p.Id.ToString(),
                        PermissionName = p.PermissionName,
                        Resource = p.Resource,
                        Description = p.Description,
                        IsActive = p.IsActive,
                        CreatedAt = p.CreatedAt.ToString("o"),
                        CreatedBy = p.CreatedBy
                    }).ToList()
                    : new List<PermissionDto>(),
                Roles = u.RoleAssignments.Where(r => r.IsActive).Select(r => new UserRoleDto
                {
                    Id = r.Id.ToString(),
                    RoleId = r.RoleId.ToString(),
                    RoleName = r.RoleName,
                    RoleDisplayName = r.RoleDisplayName,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt.ToString("o")
                }).ToList()
            }).ToList();
            
            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { error = "Failed to retrieve users" });
        }
    }

    /// <summary>
    /// Get user by email
    /// </summary>
    [HttpGet("by-email/{email}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByEmail(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(email, cancellationToken);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }
            
            var userDto = new UserDto
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                Name = user.Name,
                FirstLoginAt = user.FirstLoginAt?.ToString("o") ?? string.Empty,
                LastLoginAt = user.LastLoginAt?.ToString("o") ?? string.Empty,
                CreatedAt = user.CreatedAt.ToString("o"),
                Permissions = user.Permissions.Where(p => p.IsActive).Select(p => new PermissionDto
                {
                    Id = p.Id.ToString(),
                    PermissionName = p.PermissionName,
                    Resource = p.Resource,
                    Description = p.Description,
                    IsActive = p.IsActive,
                    CreatedAt = p.CreatedAt.ToString("o"),
                    CreatedBy = p.CreatedBy
                }).ToList(),
                Roles = user.RoleAssignments.Where(r => r.IsActive).Select(r => new UserRoleDto
                {
                    Id = r.Id.ToString(),
                    RoleId = r.RoleId.ToString(),
                    RoleName = r.RoleName,
                    RoleDisplayName = r.RoleDisplayName,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt.ToString("o")
                }).ToList()
            };
            
            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email {Email}", email);
            return StatusCode(500, new { error = "Failed to retrieve user" });
        }
    }

    /// <summary>
    /// Create or update user
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateOrUpdateUser([FromBody] CreateOrUpdateUserRequest request)
    {
        // Stub implementation
        return BadRequest(new { error = "User creation not yet implemented" });
    }

    /// <summary>
    /// Grant permission to user
    /// </summary>
    [HttpPost("{id}/permissions")]
    [ProducesResponseType(typeof(PermissionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GrantPermission(string id, [FromBody] GrantPermissionRequest request)
    {
        // Stub implementation
        return NotFound(new { error = "User not found" });
    }

    /// <summary>
    /// Revoke permission from user
    /// </summary>
    [HttpDelete("permissions/{permissionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult RevokePermission(string permissionId)
    {
        // Stub implementation
        return NotFound(new { error = "Permission not found" });
    }

    /// <summary>
    /// Assign role to user
    /// </summary>
    [HttpPost("{id}/roles")]
    [ProducesResponseType(typeof(UserRoleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult AssignRoleToUser(string id, [FromBody] AssignRoleRequest request)
    {
        // Stub implementation
        return NotFound(new { error = "User not found" });
    }

    /// <summary>
    /// Remove role from user
    /// </summary>
    [HttpDelete("{id}/roles/{userRoleId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult RemoveRoleFromUser(string id, string userRoleId)
    {
        // Stub implementation
        return NotFound(new { error = "User role not found" });
    }
}

// DTOs
public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string FirstLoginAt { get; set; } = string.Empty;
    public string LastLoginAt { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public List<PermissionDto> Permissions { get; set; } = new();
    public List<UserRoleDto> Roles { get; set; } = new();
}

public class PermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string? Resource { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedAt { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
}

public class UserRoleDto
{
    public string Id { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string RoleDisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string CreatedAt { get; set; } = string.Empty;
}

public class UsersListResponse
{
    public List<UserDto> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class CreateOrUpdateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
}

public class GrantPermissionRequest
{
    public string PermissionName { get; set; } = string.Empty;
    public string? Resource { get; set; }
    public string? Description { get; set; }
}

public class AssignRoleRequest
{
    public string RoleId { get; set; } = string.Empty;
}

