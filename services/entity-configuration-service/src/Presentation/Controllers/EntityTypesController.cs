using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using EntityConfigurationService.Presentation.Models;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EntityConfigurationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class EntityTypesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<EntityTypesController> _logger;

    public EntityTypesController(IMediator mediator, ILogger<EntityTypesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all entity types
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<EntityTypeDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includeInactive = false,
        [FromQuery] bool includeRequirements = false,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllEntityTypesQuery(includeInactive, includeRequirements);
        var entityTypes = await _mediator.Send(query, cancellationToken);

        var dtos = entityTypes.Select(et => et.Adapt<EntityTypeDto>()).ToList();
        return Ok(dtos);
    }

    /// <summary>
    /// Get entity type by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EntityTypeDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetEntityTypeByIdQuery(id);
        var entityType = await _mediator.Send(query, cancellationToken);

        if (entityType == null)
            return NotFound(new { message = $"Entity type with ID '{id}' not found" });

        return Ok(entityType.Adapt<EntityTypeDto>());
    }

    /// <summary>
    /// Get entity type by code
    /// </summary>
    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(EntityTypeDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("GetByCode called with code: '{Code}' (length: {Length})", code, code?.Length ?? 0);
        
        var query = new GetEntityTypeByCodeQuery(code);
        var entityType = await _mediator.Send(query, cancellationToken);

        if (entityType == null)
        {
            _logger.LogWarning("Entity type with code '{Code}' not found in database", code);
            return NotFound(new { message = $"Entity type with code '{code}' not found" });
        }

        _logger.LogInformation("Found entity type: {Code} (ID: {Id}, DisplayName: {DisplayName})", 
            entityType.Code, entityType.Id, entityType.DisplayName);
        
        return Ok(entityType.Adapt<EntityTypeDto>());
    }

    /// <summary>
    /// Create a new entity type
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateEntityTypeResult), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create(
        [FromBody] CreateEntityTypeRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreateEntityTypeCommand(
            request.Code,
            request.DisplayName,
            request.Description,
            request.Icon
        );

        var result = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result
        );
    }

    /// <summary>
    /// Update an entity type
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UpdateEntityTypeResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateEntityTypeRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateEntityTypeCommand(
            id,
            request.DisplayName,
            request.Description,
            request.IsActive,
            request.Icon
        );

        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Delete an entity type
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new DeleteEntityTypeCommand(id);
            var result = await _mediator.Send(command, cancellationToken);

            if (!result)
                return NotFound(new { message = $"Entity type with ID '{id}' not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot delete entity type {EntityTypeId}", id);
            return BadRequest(new { 
                error = "Cannot delete entity type", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting entity type {EntityTypeId}", id);
            return StatusCode(500, new { 
                error = "An error occurred while deleting the entity type", 
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Add a requirement to an entity type
    /// </summary>
    [HttpPost("{entityTypeId}/requirements")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddRequirement(
        Guid entityTypeId,
        [FromBody] AddRequirementRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddRequirementToEntityTypeCommand(
            entityTypeId,
            request.RequirementId,
            request.IsRequired,
            request.DisplayOrder
        );

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Remove a requirement from an entity type
    /// </summary>
    [HttpDelete("{entityTypeId}/requirements/{requirementId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveRequirement(
        Guid entityTypeId,
        Guid requirementId,
        CancellationToken cancellationToken = default)
    {
        var command = new RemoveRequirementFromEntityTypeCommand(entityTypeId, requirementId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Entity type or requirement not found" });

        return NoContent();
    }
}
