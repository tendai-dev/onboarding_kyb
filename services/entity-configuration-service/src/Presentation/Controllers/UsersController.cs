using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EntityConfigurationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IMediator mediator, ILogger<UsersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with their permissions
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<UserDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includePermissions = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetAllUsersQuery(includePermissions);
            var users = await _mediator.Send(query, cancellationToken);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { error = "An error occurred while getting users", message = ex.Message });
        }
    }

    /// <summary>
    /// Get user by email
    /// </summary>
    [HttpGet("by-email/{email}")]
    [ProducesResponseType(typeof(UserDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByEmail(
        string email,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetUserByEmailQuery(email);
            var user = await _mediator.Send(query, cancellationToken);

            if (user == null)
                return NotFound(new { message = $"User with email '{email}' not found" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email {Email}", email);
            return StatusCode(500, new { error = "An error occurred while getting user", message = ex.Message });
        }
    }

    /// <summary>
    /// Create or update user (automatically called on login)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateOrUpdateUserResult), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateOrUpdate(
        [FromBody] CreateOrUpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new CreateOrUpdateUserCommand(
                request.Email,
                request.Name
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating or updating user {Email}", request.Email);
            return StatusCode(500, new { error = "An error occurred while creating or updating user", message = ex.Message });
        }
    }

    /// <summary>
    /// Grant permission to a user
    /// </summary>
    [HttpPost("{userId}/permissions")]
    [ProducesResponseType(typeof(GrantPermissionResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GrantPermission(
        Guid userId,
        [FromBody] GrantPermissionRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get current user email from headers if available
            var createdBy = Request.Headers["X-User-Email"].FirstOrDefault() ?? "system";

            var command = new GrantPermissionCommand(
                userId,
                request.PermissionName,
                request.Resource,
                request.Description,
                createdBy
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot grant permission to user {UserId}", userId);
            return BadRequest(new { error = "Cannot grant permission", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error granting permission to user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while granting permission", message = ex.Message });
        }
    }

    /// <summary>
    /// Revoke permission from a user
    /// </summary>
    [HttpDelete("permissions/{permissionId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RevokePermission(
        Guid permissionId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new RevokePermissionCommand(permissionId);
            var result = await _mediator.Send(command, cancellationToken);

            if (!result.Success)
                return NotFound(new { message = $"Permission with ID '{permissionId}' not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot revoke permission {PermissionId}", permissionId);
            return BadRequest(new { error = "Cannot revoke permission", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking permission {PermissionId}", permissionId);
            return StatusCode(500, new { error = "An error occurred while revoking permission", message = ex.Message });
        }
    }

    /// <summary>
    /// Assign a role to a user
    /// </summary>
    [HttpPost("{userId}/roles")]
    [ProducesResponseType(typeof(AssignRoleToUserResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AssignRole(
        Guid userId,
        [FromBody] AssignRoleToUserRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var createdBy = Request.Headers["X-User-Email"].FirstOrDefault() ?? "system";

            var command = new AssignRoleToUserCommand(
                userId,
                request.RoleId,
                createdBy
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot assign role to user {UserId}", userId);
            return BadRequest(new { error = "Cannot assign role to user", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role to user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while assigning role to user", message = ex.Message });
        }
    }

    /// <summary>
    /// Remove a role from a user
    /// </summary>
    [HttpDelete("{userId}/roles/{userRoleId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveRole(
        Guid userId,
        Guid userRoleId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new RemoveRoleFromUserCommand(userRoleId);
            await _mediator.Send(command, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot remove role from user {UserId}", userId);
            return BadRequest(new { error = "Cannot remove role from user", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role from user {UserId}", userId);
            return StatusCode(500, new { error = "An error occurred while removing role from user", message = ex.Message });
        }
    }
}

// Request/Response models
public record CreateOrUpdateUserRequest(
    string Email,
    string? Name = null
);

public record GrantPermissionRequest(
    string PermissionName,
    string? Resource = null,
    string? Description = null
);

public record AssignRoleToUserRequest(
    Guid RoleId
);

