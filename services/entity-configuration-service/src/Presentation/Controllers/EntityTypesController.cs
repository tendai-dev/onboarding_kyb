using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using EntityConfigurationService.Presentation.Models;
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

        var dtos = entityTypes.Select(EntityTypeDto.FromDomain).ToList();
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

        return Ok(EntityTypeDto.FromDomain(entityType));
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
            request.Description
        );

        var result = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result
        );
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
}
