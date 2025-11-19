using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using EntityConfigurationService.Presentation.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace EntityConfigurationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class WizardConfigurationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<WizardConfigurationsController> _logger;

    public WizardConfigurationsController(IMediator mediator, ILogger<WizardConfigurationsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all wizard configurations
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<WizardConfigurationDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllWizardConfigurationsQuery(includeInactive);
        var configurations = await _mediator.Send(query, cancellationToken);

        var dtos = configurations.Select(WizardConfigurationDto.FromDomain).ToList();
        return Ok(dtos);
    }

    /// <summary>
    /// Get wizard configuration by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(WizardConfigurationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetWizardConfigurationByIdQuery(id);
        var configuration = await _mediator.Send(query, cancellationToken);

        if (configuration == null)
            return NotFound(new { message = $"Wizard configuration with ID '{id}' not found" });

        return Ok(WizardConfigurationDto.FromDomain(configuration));
    }

    /// <summary>
    /// Get wizard configuration by entity type ID
    /// </summary>
    [HttpGet("by-entity-type/{entityTypeId}")]
    [ProducesResponseType(typeof(WizardConfigurationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByEntityType(Guid entityTypeId, CancellationToken cancellationToken = default)
    {
        var query = new GetWizardConfigurationByEntityTypeQuery(entityTypeId);
        var configuration = await _mediator.Send(query, cancellationToken);

        if (configuration == null)
            return NotFound(new { message = $"Wizard configuration for entity type '{entityTypeId}' not found" });

        return Ok(WizardConfigurationDto.FromDomain(configuration));
    }

    /// <summary>
    /// Create a new wizard configuration
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateWizardConfigurationResult), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create(
        [FromBody] CreateWizardConfigurationRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreateWizardConfigurationCommand(
            request.EntityTypeId,
            request.IsActive,
            request.Steps.Select(s => new Application.Commands.WizardStepDto(
                s.Title,
                s.Subtitle,
                s.RequirementTypes,
                s.ChecklistCategory,
                s.StepNumber,
                s.IsActive
            )).ToList()
        );

        var result = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result
        );
    }

    /// <summary>
    /// Update a wizard configuration
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UpdateWizardConfigurationResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateWizardConfigurationRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateWizardConfigurationCommand(
            id,
            request.IsActive,
            request.Steps.Select(s => new Application.Commands.WizardStepDto(
                s.Title,
                s.Subtitle,
                s.RequirementTypes,
                s.ChecklistCategory,
                s.StepNumber,
                s.IsActive
            )).ToList()
        );

        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Delete a wizard configuration
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteWizardConfigurationCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Wizard configuration with ID '{id}' not found" });

        return NoContent();
    }
}

