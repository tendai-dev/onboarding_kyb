using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthenticationService.Application.Services;
using System.Security.Claims;

namespace AuthenticationService.Presentation.Controllers;

/// <summary>
/// User management controller
/// </summary>
[ApiController]
[Route("api/users")]
[Authorize]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest(new { error = "User ID not found in token" });
            }

            var user = await _userService.GetUserByIdAsync(userId.Value);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            var response = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                MiddleName = user.MiddleName,
                FullName = user.GetFullName(),
                ProfileImageUrl = user.ProfileImageUrl,
                Status = user.Status.ToString(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = user.Roles.Where(r => r.IsActive).Select(r => new RoleDto
                {
                    Name = r.RoleName,
                    Scope = r.Scope,
                    AssignedAt = r.AssignedAt
                }).ToList(),
                Organizations = user.Organizations.Where(o => o.IsActive).Select(o => new OrganizationMembershipDto
                {
                    OrganizationId = o.OrganizationId,
                    Role = o.Role,
                    JoinedAt = o.JoinedAt
                }).ToList(),
                Preferences = user.Preferences
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user profile");
            return StatusCode(500, new { error = "Failed to retrieve user profile" });
        }
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateUserProfileRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest(new { error = "User ID not found in token" });
            }

            var user = await _userService.UpdateUserProfileAsync(userId.Value, request);

            var response = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                MiddleName = user.MiddleName,
                FullName = user.GetFullName(),
                ProfileImageUrl = user.ProfileImageUrl,
                Status = user.Status.ToString(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt,
                Preferences = user.Preferences
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile for user {UserId}", GetCurrentUserId());
            return BadRequest(new { error = "Failed to update user profile" });
        }
    }

    /// <summary>
    /// Get user by ID (admin only)
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "AdminPolicy")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(Guid id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            var response = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                MiddleName = user.MiddleName,
                FullName = user.GetFullName(),
                ProfileImageUrl = user.ProfileImageUrl,
                Status = user.Status.ToString(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = user.Roles.Where(r => r.IsActive).Select(r => new RoleDto
                {
                    Name = r.RoleName,
                    Scope = r.Scope,
                    AssignedAt = r.AssignedAt
                }).ToList(),
                Organizations = user.Organizations.Where(o => o.IsActive).Select(o => new OrganizationMembershipDto
                {
                    OrganizationId = o.OrganizationId,
                    Role = o.Role,
                    JoinedAt = o.JoinedAt
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", id);
            return StatusCode(500, new { error = "Failed to retrieve user" });
        }
    }

    /// <summary>
    /// List users (admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "AdminPolicy")]
    [ProducesResponseType(typeof(PagedResponse<UserSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        try
        {
            // Implementation would include pagination and filtering
            // For now, return a simple response structure
            var response = new PagedResponse<UserSummaryDto>
            {
                Data = new List<UserSummaryDto>(),
                Page = page,
                PageSize = pageSize,
                TotalCount = 0,
                TotalPages = 0
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing users");
            return StatusCode(500, new { error = "Failed to retrieve users" });
        }
    }

    /// <summary>
    /// Assign role to user (admin only)
    /// </summary>
    [HttpPost("{id:guid}/roles")]
    [Authorize(Policy = "AdminPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] AssignRoleRequest request)
    {
        try
        {
            await _userService.AssignRoleToUserAsync(id, request.RoleName, request.Scope);
            return Ok(new { message = "Role assigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role {Role} to user {UserId}", request.RoleName, id);
            return BadRequest(new { error = "Failed to assign role" });
        }
    }

    /// <summary>
    /// Remove role from user (admin only)
    /// </summary>
    [HttpDelete("{id:guid}/roles/{roleName}")]
    [Authorize(Policy = "AdminPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRole(Guid id, string roleName, [FromQuery] string? scope = null)
    {
        try
        {
            await _userService.RemoveRoleFromUserAsync(id, roleName, scope);
            return Ok(new { message = "Role removed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role {Role} from user {UserId}", roleName, id);
            return BadRequest(new { error = "Failed to remove role" });
        }
    }

    /// <summary>
    /// Deactivate user (admin only)
    /// </summary>
    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Policy = "AdminPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(Guid id, [FromBody] DeactivateUserRequest request)
    {
        try
        {
            await _userService.DeactivateUserAsync(id, request.Reason);
            return Ok(new { message = "User deactivated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user {UserId}", id);
            return BadRequest(new { error = "Failed to deactivate user" });
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value ?? 
                         User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

// DTOs
public class UserProfileResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<RoleDto> Roles { get; set; } = new();
    public List<OrganizationMembershipDto> Organizations { get; set; } = new();
    public UserPreferences? Preferences { get; set; }
}

public class UserSummaryDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class RoleDto
{
    public string Name { get; set; } = string.Empty;
    public string? Scope { get; set; }
    public DateTime AssignedAt { get; set; }
}

public class OrganizationMembershipDto
{
    public Guid OrganizationId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

public class AssignRoleRequest
{
    public string RoleName { get; set; } = string.Empty;
    public string? Scope { get; set; }
}

public class DeactivateUserRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class PagedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
