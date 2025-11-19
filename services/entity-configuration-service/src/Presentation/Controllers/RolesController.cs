using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EntityConfigurationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class RolesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<RolesController> _logger;

    public RolesController(IMediator mediator, ILogger<RolesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all roles
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RoleDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includePermissions = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetAllRolesQuery(includePermissions);
            var roles = await _mediator.Send(query, cancellationToken);
            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all roles");
            return StatusCode(500, new { error = "An error occurred while getting roles", message = ex.Message });
        }
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{roleId}")]
    [ProducesResponseType(typeof(RoleDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(
        Guid roleId,
        [FromQuery] bool includePermissions = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetRoleByIdQuery(roleId, includePermissions);
            var role = await _mediator.Send(query, cancellationToken);

            if (role == null)
                return NotFound(new { message = $"Role with ID '{roleId}' not found" });

            return Ok(role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {RoleId}", roleId);
            return StatusCode(500, new { error = "An error occurred while getting role", message = ex.Message });
        }
    }

    /// <summary>
    /// Create a new role
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateRoleResult), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create(
        [FromBody] CreateRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var createdBy = Request.Headers["X-User-Email"].FirstOrDefault() ?? "system";

            var command = new CreateRoleCommand(
                request.Name,
                request.DisplayName,
                request.Description,
                createdBy
            );

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { roleId = result.RoleId }, result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot create role");
            return BadRequest(new { error = "Cannot create role", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role");
            return StatusCode(500, new { error = "An error occurred while creating role", message = ex.Message });
        }
    }

    /// <summary>
    /// Update a role
    /// </summary>
    [HttpPut("{roleId}")]
    [ProducesResponseType(typeof(UpdateRoleResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid roleId,
        [FromBody] UpdateRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new UpdateRoleCommand(
                roleId,
                request.DisplayName,
                request.Description
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot update role {RoleId}", roleId);
            return BadRequest(new { error = "Cannot update role", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {RoleId}", roleId);
            return StatusCode(500, new { error = "An error occurred while updating role", message = ex.Message });
        }
    }

    /// <summary>
    /// Delete a role
    /// </summary>
    [HttpDelete("{roleId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(
        Guid roleId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new DeleteRoleCommand(roleId);
            await _mediator.Send(command, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot delete role {RoleId}", roleId);
            return BadRequest(new { error = "Cannot delete role", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {RoleId}", roleId);
            return StatusCode(500, new { error = "An error occurred while deleting role", message = ex.Message });
        }
    }

    /// <summary>
    /// Add a permission to a role
    /// </summary>
    [HttpPost("{roleId}/permissions")]
    [ProducesResponseType(typeof(AddPermissionToRoleResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddPermission(
        Guid roleId,
        [FromBody] AddPermissionToRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new AddPermissionToRoleCommand(
                roleId,
                request.PermissionName,
                request.Resource
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot add permission to role {RoleId}", roleId);
            return BadRequest(new { error = "Cannot add permission to role", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding permission to role {RoleId}", roleId);
            return StatusCode(500, new { error = "An error occurred while adding permission to role", message = ex.Message });
        }
    }

    /// <summary>
    /// Remove a permission from a role
    /// </summary>
    [HttpDelete("{roleId}/permissions/{permissionId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemovePermission(
        Guid roleId,
        Guid permissionId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new RemovePermissionFromRoleCommand(roleId, permissionId);
            await _mediator.Send(command, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot remove permission from role {RoleId}", roleId);
            return BadRequest(new { error = "Cannot remove permission from role", message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing permission from role {RoleId}", roleId);
            return StatusCode(500, new { error = "An error occurred while removing permission from role", message = ex.Message });
        }
    }
}

// Request models
public record CreateRoleRequest(
    string Name,
    string DisplayName,
    string? Description = null
);

public record UpdateRoleRequest(
    string DisplayName,
    string? Description = null
);

public record AddPermissionToRoleRequest(
    string PermissionName,
    string? Resource = null
);

