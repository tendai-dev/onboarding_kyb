using MediatR;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Queries;
using System.Text.Json.Serialization;

namespace OnboardingApi.Presentation.Controllers.EntityConfiguration;

[ApiController]
[Route("api/v1/wizardconfigurations")]
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
        return Ok(configurations);
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

        return Ok(configuration);
    }

    /// <summary>
    /// Get wizard configuration by entity type ID
    /// </summary>
    [HttpGet("by-entity-type/{entityTypeId}")]
    [ProducesResponseType(typeof(WizardConfigurationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByEntityTypeId(Guid entityTypeId, CancellationToken cancellationToken = default)
    {
        var query = new GetWizardConfigurationByEntityTypeIdQuery(entityTypeId);
        var configuration = await _mediator.Send(query, cancellationToken);

        if (configuration == null)
            return NotFound(new { message = $"Wizard configuration for entity type '{entityTypeId}' not found" });

        return Ok(configuration);
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
        try
        {
            _logger.LogInformation("Received wizard configuration request. EntityTypeId: {EntityTypeId}, IsActive: {IsActive}, StepsCount: {StepsCount}", 
                request.EntityTypeId, request.IsActive, request.Steps?.Count ?? 0);
            
            if (request.EntityTypeId == Guid.Empty)
            {
                _logger.LogWarning("EntityTypeId is empty GUID. Request may not have been deserialized correctly.");
                return BadRequest(new { 
                    error = "Invalid request", 
                    message = "EntityTypeId is required and cannot be empty" 
                });
            }
            
            var command = new CreateWizardConfigurationCommand(
                request.EntityTypeId,
                request.IsActive,
                request.Steps.Select(s => new CreateWizardStepCommand(
                    s.Title,
                    s.Subtitle,
                    s.RequirementTypes ?? new List<string>(),
                    s.ChecklistCategory ?? string.Empty,
                    s.StepNumber,
                    s.IsActive
                )).ToList()
            );

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot create wizard configuration");
            return BadRequest(new { 
                error = "Cannot create wizard configuration", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating wizard configuration");
            return StatusCode(500, new { 
                error = "An error occurred while creating the wizard configuration", 
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Update an existing wizard configuration
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
        try
        {
            var command = new UpdateWizardConfigurationCommand(
                id,
                request.IsActive,
                request.Steps.Select(s => new CreateWizardStepCommand(
                    s.Title,
                    s.Subtitle,
                    s.RequirementTypes ?? new List<string>(),
                    s.ChecklistCategory ?? string.Empty,
                    s.StepNumber,
                    s.IsActive
                )).ToList()
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot update wizard configuration {WizardConfigurationId}", id);
            return BadRequest(new { 
                error = "Cannot update wizard configuration", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating wizard configuration {WizardConfigurationId}", id);
            return StatusCode(500, new { 
                error = "An error occurred while updating the wizard configuration", 
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Delete a wizard configuration
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new DeleteWizardConfigurationCommand(id);
            var deleted = await _mediator.Send(command, cancellationToken);

            if (!deleted)
                return NotFound(new { message = $"Wizard configuration with ID '{id}' not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting wizard configuration {WizardConfigurationId}", id);
            return StatusCode(500, new { 
                error = "An error occurred while deleting the wizard configuration", 
                message = ex.Message 
            });
        }
    }
}

// Request DTOs
public class CreateWizardConfigurationRequest
{
    [JsonPropertyName("entityTypeId")]
    public Guid EntityTypeId { get; set; }
    
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
    
    [JsonPropertyName("steps")]
    public List<CreateWizardStepRequest> Steps { get; set; } = new();
}

public class CreateWizardStepRequest
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    
    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;
    
    [JsonPropertyName("requirementTypes")]
    public List<string>? RequirementTypes { get; set; }
    
    [JsonPropertyName("checklistCategory")]
    public string? ChecklistCategory { get; set; }
    
    [JsonPropertyName("stepNumber")]
    public int StepNumber { get; set; }
    
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
}

public class UpdateWizardConfigurationRequest
{
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
    
    [JsonPropertyName("steps")]
    public List<CreateWizardStepRequest> Steps { get; set; } = new();
}

