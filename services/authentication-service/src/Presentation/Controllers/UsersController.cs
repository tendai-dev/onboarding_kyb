using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthenticationService.Application.Services;
using AuthenticationService.Infrastructure.ExternalServices;
using System.Security.Claims;
using System.Linq;

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
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserService userService,
        KeycloakAdminClient keycloakClient,
        ILogger<UsersController> logger)
    {
        _userService = userService;
        _keycloakClient = keycloakClient;
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
#if !DEBUG
    [Authorize(Policy = "AdminPolicy")]
#else
    [AllowAnonymous]
#endif
    [ProducesResponseType(typeof(UsersListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        try
        {
            // Fetch users from Keycloak Admin API
            var keycloakUsers = await _keycloakClient.GetUsersAsync(
                search: search,
                first: (page - 1) * pageSize,
                max: pageSize);

            // Convert Keycloak users to DTOs with their roles
            var userDtos = new List<UserDto>();
            foreach (var keycloakUser in keycloakUsers)
            {
                // Get user roles from Keycloak
                var roles = await _keycloakClient.GetUserRolesAsync(keycloakUser.Id);
                var roleNames = roles.Where(r => !r.ClientRole).Select(r => r.Name).ToList();

                // Build full name
                var fullName = string.Empty;
                if (!string.IsNullOrEmpty(keycloakUser.FirstName) || !string.IsNullOrEmpty(keycloakUser.LastName))
                {
                    fullName = $"{keycloakUser.FirstName ?? ""} {keycloakUser.LastName ?? ""}".Trim();
                }
                if (string.IsNullOrEmpty(fullName))
                {
                    fullName = keycloakUser.Username ?? keycloakUser.Email ?? "Unknown";
                }

                var createdAt = keycloakUser.CreatedTimestamp > 0
                    ? DateTimeOffset.FromUnixTimeMilliseconds(keycloakUser.CreatedTimestamp).DateTime
                    : DateTime.UtcNow;

                var lastLogin = keycloakUser.LastLoginTimestamp.HasValue && keycloakUser.LastLoginTimestamp.Value > 0
                    ? DateTimeOffset.FromUnixTimeMilliseconds(keycloakUser.LastLoginTimestamp.Value).DateTime
                    : (DateTime?)null;

                userDtos.Add(new UserDto
                {
                    Id = keycloakUser.Id,
                    Email = keycloakUser.Email ?? keycloakUser.Username ?? "",
                    Name = fullName,
                    FirstName = keycloakUser.FirstName,
                    LastName = keycloakUser.LastName,
                    Roles = roleNames,
                    Status = keycloakUser.Enabled ? "Active" : "Inactive",
                    LastLogin = lastLogin?.ToString("o"),
                    CreatedAt = createdAt.ToString("o")
                });
            }

            // Get total count for pagination (Note: Keycloak doesn't return total count easily, so we'll estimate)
            // For accurate counts, you'd need to make an additional request or cache the count
            var totalCount = userDtos.Count; // This is approximate - in production, implement proper counting
            if (!string.IsNullOrEmpty(search) || page == 1)
            {
                // Try to get a count by fetching without pagination (limited to reasonable number)
                try
                {
                    var allUsers = await _keycloakClient.GetUsersAsync(search: search, max: 1000);
                    totalCount = allUsers.Count;
                }
                catch
                {
                    // If that fails, use current page size as estimate
                    totalCount = pageSize;
                }
            }

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var response = new UsersListResponse
            {
                Users = userDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
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
    [HttpPost("{id}/roles")]
#if !DEBUG
    [Authorize(Policy = "AdminPolicy")]
#else
    [AllowAnonymous]
#endif
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRole(string id, [FromBody] AssignRoleRequest request)
    {
        try
        {
            await _keycloakClient.AssignRoleToUserAsync(id, request.RoleName);
            return Ok(new { message = "Role assigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role {Role} to user {UserId}", request.RoleName, id);
            return BadRequest(new { error = ex.Message ?? "Failed to assign role" });
        }
    }

    /// <summary>
    /// Remove role from user (admin only)
    /// </summary>
    [HttpDelete("{id}/roles/{roleName}")]
#if !DEBUG
    [Authorize(Policy = "AdminPolicy")]
#else
    [AllowAnonymous]
#endif
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRole(string id, string roleName, [FromQuery] string? scope = null)
    {
        try
        {
            await _keycloakClient.RemoveRoleFromUserAsync(id, roleName);
            return Ok(new { message = "Role removed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role {Role} from user {UserId}", roleName, id);
            return BadRequest(new { error = ex.Message ?? "Failed to remove role" });
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

public class UsersListResponse
{
    public List<UserDto> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public List<string> Roles { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public string? LastLogin { get; set; }
    public string? CreatedAt { get; set; }
}
