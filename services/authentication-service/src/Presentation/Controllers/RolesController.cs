using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthenticationService.Infrastructure.ExternalServices;

namespace AuthenticationService.Presentation.Controllers;

/// <summary>
/// Roles management controller
/// </summary>
[ApiController]
[Route("api/roles")]
[Produces("application/json")]
public class RolesController : ControllerBase
{
    private readonly KeycloakAdminClient _keycloakClient;
    private readonly ILogger<RolesController> _logger;

    public RolesController(
        KeycloakAdminClient keycloakClient,
        ILogger<RolesController> logger)
    {
        _keycloakClient = keycloakClient;
        _logger = logger;
    }

    /// <summary>
    /// Get all realm roles
    /// </summary>
    [HttpGet]
#if !DEBUG
    [Authorize(Policy = "AdminPolicy")]
#else
    [AllowAnonymous]
#endif
    [ProducesResponseType(typeof(List<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        try
        {
            var keycloakRoles = await _keycloakClient.GetRealmRolesAsync();
            
            var roles = keycloakRoles.Where(r => !r.ClientRole).Select(r => new RoleDto
            {
                Name = r.Name,
                Description = r.Description,
                UserCount = 0 // Would need to calculate this separately
            }).ToList();

            return Ok(new { roles });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles");
            return StatusCode(500, new { error = "Failed to retrieve roles" });
        }
    }

    /// <summary>
    /// Create a new realm role
    /// </summary>
    [HttpPost]
#if !DEBUG
    [Authorize(Policy = "AdminPolicy")]
#else
    [AllowAnonymous]
#endif
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { error = "Role name is required" });
            }

            var keycloakRole = await _keycloakClient.CreateRealmRoleAsync(
                request.Name,
                request.Description);

            var role = new RoleDto
            {
                Name = keycloakRole.Name,
                Description = keycloakRole.Description,
                UserCount = 0
            };

            return CreatedAtAction(nameof(GetRoles), new { name = role.Name }, new { role });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role {RoleName}", request.Name);
            return BadRequest(new { error = ex.Message ?? "Failed to create role" });
        }
    }

    /// <summary>
    /// Delete a realm role
    /// </summary>
    [HttpDelete("{roleName}")]
#if !DEBUG
    [Authorize(Policy = "AdminPolicy")]
#else
    [AllowAnonymous]
#endif
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRole(string roleName)
    {
        try
        {
            // Prevent deletion of system roles
            var systemRoles = new[] { "admin", "reviewer", "approver", "partner" };
            if (systemRoles.Any(r => r.Equals(roleName, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { error = $"Cannot delete system role '{roleName}'" });
            }

            await _keycloakClient.DeleteRealmRoleAsync(roleName);
            return Ok(new { message = $"Role '{roleName}' deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {RoleName}", roleName);
            if (ex.Message.Contains("not found"))
            {
                return NotFound(new { error = ex.Message });
            }
            return BadRequest(new { error = ex.Message ?? "Failed to delete role" });
        }
    }
}

public class RoleDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int UserCount { get; set; }
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

