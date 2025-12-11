using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Queries;

namespace OnboardingApi.Presentation.Controllers.EntityConfiguration;

[ApiController]
[Route("api/v1/entity-types")]
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

        return Ok(entityTypes);
    }

    /// <summary>
    /// Get entity type by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EntityTypeDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(
        Guid id, 
        [FromQuery] bool includeRequirements = false,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[EntityTypesController] GetById called with id={Id}, includeRequirements={IncludeRequirements}", 
            id, includeRequirements);
        
        var query = new GetEntityTypeByIdQuery(id, includeRequirements);
        var entityType = await _mediator.Send(query, cancellationToken);

        if (entityType == null)
            return NotFound(new { message = $"Entity type with ID '{id}' not found" });

        _logger.LogInformation("[EntityTypesController] Returning entity type with {Count} requirements, DTO has requirements field: {HasField}", 
            entityType.Requirements?.Count ?? 0, entityType.Requirements != null);
        
        if (entityType.Requirements != null && entityType.Requirements.Count > 0)
        {
            _logger.LogInformation("[EntityTypesController] First requirement ID: {Id}", entityType.Requirements[0].RequirementId);
        }

        return Ok(entityType);
    }

    /// <summary>
    /// Get entity type by code
    /// </summary>
    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(EntityTypeDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByCode(
        string code, 
        [FromQuery] bool includeRequirements = false,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[EntityTypesController] GetByCode called with code={Code}, includeRequirements={IncludeRequirements}", 
            code, includeRequirements);
        
        var query = new GetEntityTypeByCodeQuery(code, includeRequirements);
        var entityType = await _mediator.Send(query, cancellationToken);

        if (entityType == null)
            return NotFound(new { message = $"Entity type with code '{code}' not found" });

        _logger.LogInformation("[EntityTypesController] Returning entity type with {Count} requirements", 
            entityType.Requirements?.Count ?? 0);

        return Ok(entityType);
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
        try
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
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating entity type with code {Code}. InnerException: {InnerException}", 
                request.Code, ex.InnerException?.ToString() ?? "None");
            
            // Extract the actual error message from nested inner exceptions
            var actualMessage = ex.InnerException?.Message ?? ex.Message;
            var innerInnerMessage = ex.InnerException?.InnerException?.Message;
            if (!string.IsNullOrEmpty(innerInnerMessage))
            {
                actualMessage = innerInnerMessage;
            }
            
            // Check for unique constraint violation (PostgreSQL error code 23505)
            if (actualMessage.Contains("23505", StringComparison.OrdinalIgnoreCase) ||
                actualMessage.Contains("duplicate", StringComparison.OrdinalIgnoreCase) || 
                actualMessage.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
                actualMessage.Contains("unique constraint", StringComparison.OrdinalIgnoreCase) ||
                actualMessage.Contains("IX_entity_types_code", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { 
                    error = "Duplicate entity type code", 
                    message = $"An entity type with code '{request.Code}' already exists. Please use a different code." 
                });
            }
            
            // Check for other constraint violations
            if (ex.InnerException != null)
            {
                // Try to extract a more user-friendly message
                var userMessage = actualMessage;
                if (actualMessage.Contains("constraint", StringComparison.OrdinalIgnoreCase))
                {
                    userMessage = "A database constraint was violated. Please check your input and try again.";
                }
                
                return BadRequest(new { 
                    error = "Database constraint violation", 
                    message = userMessage,
                    details = actualMessage // Include details for debugging in development
                });
            }
            
            return StatusCode(500, new { 
                error = "An error occurred while saving the entity type", 
                message = actualMessage
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation creating entity type with code {Code}", request.Code);
            return BadRequest(new { 
                error = "Invalid operation", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating entity type with code {Code}", request.Code);
            return StatusCode(500, new { 
                error = "An error occurred while creating the entity type", 
                message = ex.Message 
            });
        }
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
            _logger.LogWarning(ex, "Cannot delete entity type {EntityTypeId}: {Message}", id, ex.Message);
            return BadRequest(new { 
                error = "Cannot delete entity type", 
                message = ex.Message 
            });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting entity type {EntityTypeId}", id);
            
            // Extract inner exception message
            var actualMessage = ex.InnerException?.Message ?? ex.Message;
            var innerInnerMessage = ex.InnerException?.InnerException?.Message;
            if (!string.IsNullOrEmpty(innerInnerMessage))
            {
                actualMessage = innerInnerMessage;
            }
            
            // Check for foreign key constraint violations
            if (actualMessage.Contains("foreign key", StringComparison.OrdinalIgnoreCase) ||
                actualMessage.Contains("23503", StringComparison.OrdinalIgnoreCase) || // PostgreSQL FK violation
                actualMessage.Contains("constraint", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { 
                    error = "Cannot delete entity type", 
                    message = "This entity type cannot be deleted because it is referenced by other records. Please remove all references before deleting." 
                });
            }
            
            return StatusCode(500, new { 
                error = "Database error", 
                message = actualMessage 
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
        // Validate request
        if (request == null)
        {
            return BadRequest(new { 
                error = "Invalid request", 
                message = "Request body is required" 
            });
        }

        if (request.RequirementId == Guid.Empty)
        {
            return BadRequest(new { 
                error = "Invalid request", 
                message = "RequirementId is required" 
            });
        }

        try
        {
            _logger.LogInformation("Adding requirement {RequirementId} to entity type {EntityTypeId} with IsRequired={IsRequired}, DisplayOrder={DisplayOrder}",
                request.RequirementId, entityTypeId, request.IsRequired, request.DisplayOrder);

            var command = new AddRequirementToEntityTypeCommand(
                entityTypeId,
                request.RequirementId,
                request.IsRequired,
                request.DisplayOrder
            );

            var result = await _mediator.Send(command, cancellationToken);
            
            if (!result)
            {
                _logger.LogWarning("Failed to add requirement {RequirementId} to entity type {EntityTypeId} - handler returned false",
                    request.RequirementId, entityTypeId);
                return NotFound(new { message = "Entity type not found" });
            }

            _logger.LogInformation("Successfully added requirement {RequirementId} to entity type {EntityTypeId}",
                request.RequirementId, entityTypeId);

            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error adding requirement {RequirementId} to entity type {EntityTypeId}", 
                request.RequirementId, entityTypeId);
            
            // Check for optimistic concurrency exception
            if (ex.Message.Contains("expected to affect 1 row(s), but actually affected 0 row(s)") ||
                ex.Message.Contains("optimistic concurrency"))
            {
                return BadRequest(new { 
                    error = "Concurrency conflict", 
                    message = "The entity type was modified by another operation. Please refresh and try again." 
                });
            }
            
            // Check for duplicate key or other constraint violations
            if (ex.InnerException?.Message?.Contains("duplicate") == true || 
                ex.InnerException?.Message?.Contains("UNIQUE") == true)
            {
                return BadRequest(new { 
                    error = "Duplicate requirement", 
                    message = "This requirement is already associated with the entity type." 
                });
            }
            
            return StatusCode(500, new { 
                error = "An error occurred while adding the requirement", 
                message = "Please try again or contact support if the issue persists." 
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation adding requirement {RequirementId} to entity type {EntityTypeId}. Error: {ErrorMessage}", 
                request.RequirementId, entityTypeId, ex.Message);
            return BadRequest(new { 
                error = "Invalid operation", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding requirement {RequirementId} to entity type {EntityTypeId}. Error: {ErrorMessage}, InnerException: {InnerException}", 
                request.RequirementId, entityTypeId, ex.Message, ex.InnerException?.Message ?? "None");
            return BadRequest(new { 
                error = "An error occurred while adding the requirement", 
                message = ex.Message,
                details = ex.InnerException?.Message
            });
        }
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
            return NotFound(new { message = "Entity type or requirement not found" });

        return NoContent();
    }
}

public class CreateEntityTypeRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("icon")]
    public string? Icon { get; set; }
}

public class UpdateEntityTypeRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool? IsActive { get; set; }
    public string? Icon { get; set; }
}

public class AddRequirementRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("requirementId")]
    public Guid RequirementId { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("isRequired")]
    public bool IsRequired { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }
}

