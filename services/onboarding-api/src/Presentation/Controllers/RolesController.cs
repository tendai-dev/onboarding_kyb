using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Roles management controller - Active Directory based roles from database
/// </summary>
[ApiController]
[Route("api/v1/roles")]
[Produces("application/json")]
public class RolesController : ControllerBase
{
    private readonly ILogger<RolesController> _logger;
    private readonly IRoleRepository _roleRepository;

    public RolesController(ILogger<RolesController> logger, IRoleRepository roleRepository)
    {
        _logger = logger;
        _roleRepository = roleRepository;
    }

    /// <summary>
    /// Get all roles
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllRoles([FromQuery] bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        try
        {
            var roles = await _roleRepository.GetAllAsync(includeInactive: false, cancellationToken);
            
            var roleDtos = roles.Select(r => new RoleDto
            {
                Id = r.Id.ToString(),
                Name = r.Name,
                DisplayName = r.DisplayName,
                Description = r.Description,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt.ToString("o"),
                UpdatedAt = r.UpdatedAt.ToString("o"),
                Permissions = includePermissions 
                    ? r.Permissions.Select(p => new RolePermissionDto
                    {
                        Id = p.Id.ToString(),
                        PermissionName = p.PermissionName,
                        Resource = p.Resource,
                        IsActive = p.IsActive
                    }).ToList()
                    : new List<RolePermissionDto>()
            }).ToList();
            
            return Ok(roleDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all roles");
            return StatusCode(500, new { error = "Failed to retrieve roles" });
        }
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoleById(string id, [FromQuery] bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!Guid.TryParse(id, out var roleId))
            {
                return BadRequest(new { error = "Invalid role ID format" });
            }
            
            var role = await _roleRepository.GetByIdAsync(roleId, cancellationToken);
            if (role == null)
            {
                return NotFound(new { error = "Role not found" });
            }
            
            var roleDto = new RoleDto
            {
                Id = role.Id.ToString(),
                Name = role.Name,
                DisplayName = role.DisplayName,
                Description = role.Description,
                IsActive = role.IsActive,
                CreatedAt = role.CreatedAt.ToString("o"),
                UpdatedAt = role.UpdatedAt.ToString("o"),
                Permissions = includePermissions 
                    ? role.Permissions.Select(p => new RolePermissionDto
                    {
                        Id = p.Id.ToString(),
                        PermissionName = p.PermissionName,
                        Resource = p.Resource,
                        IsActive = p.IsActive
                    }).ToList()
                    : new List<RolePermissionDto>()
            };
            
            return Ok(roleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {RoleId}", id);
            return StatusCode(500, new { error = "Failed to retrieve role" });
        }
    }

    /// <summary>
    /// Create a new role
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateRole([FromBody] CreateRoleRequest request)
    {
        // Stub implementation
        return BadRequest(new { error = "Role creation not yet implemented" });
    }

    /// <summary>
    /// Update a role
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult UpdateRole(string id, [FromBody] UpdateRoleRequest request)
    {
        // Stub implementation
        return NotFound(new { error = "Role not found" });
    }

    /// <summary>
    /// Delete a role
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DeleteRole(string id)
    {
        // Stub implementation
        return NotFound(new { error = "Role not found" });
    }

    /// <summary>
    /// Add permission to role
    /// </summary>
    [HttpPost("{id}/permissions")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult AddPermissionToRole(string id, [FromBody] AddPermissionToRoleRequest request)
    {
        // Stub implementation
        return NotFound(new { error = "Role not found" });
    }

    /// <summary>
    /// Remove permission from role
    /// </summary>
    [HttpDelete("{id}/permissions/{permissionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult RemovePermissionFromRole(string id, string permissionId)
    {
        // Stub implementation
        return NotFound(new { error = "Role not found" });
    }
}

// DTOs
public class RoleDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
    public List<RolePermissionDto> Permissions { get; set; } = new();
}

public class RolePermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string? Resource { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateRoleRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class AddPermissionToRoleRequest
{
    public string PermissionName { get; set; } = string.Empty;
    public string? Resource { get; set; }
}

