using MediatR;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.EntityConfiguration.Queries;
using OnboardingApi.Application.EntityConfiguration.Commands;
using System.Collections.Generic;

namespace OnboardingApi.Presentation.Controllers.EntityConfiguration;

[ApiController]
[Route("api/v1/requirements")]
[Produces("application/json")]
public class RequirementsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<RequirementsController> _logger;

    public RequirementsController(IMediator mediator, ILogger<RequirementsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all requirements
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RequirementDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllRequirementsQuery(includeInactive);
        var requirements = await _mediator.Send(query, cancellationToken);

        return Ok(requirements);
    }

    /// <summary>
    /// Get requirement by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RequirementDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetRequirementByIdQuery(id);
        var requirement = await _mediator.Send(query, cancellationToken);

        if (requirement == null)
            return NotFound(new { message = $"Requirement with ID '{id}' not found" });

        return Ok(requirement);
    }

    /// <summary>
    /// Get requirement by code
    /// </summary>
    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(RequirementDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken = default)
    {
        var query = new GetRequirementByCodeQuery(code);
        var requirement = await _mediator.Send(query, cancellationToken);

        if (requirement == null)
            return NotFound(new { message = $"Requirement with code '{code}' not found" });

        return Ok(requirement);
    }

    /// <summary>
    /// Get requirements metadata (types and field types)
    /// </summary>
    [HttpGet("metadata")]
    [ProducesResponseType(typeof(RequirementsMetadataDto), 200)]
    public IActionResult GetMetadata()
    {
        var metadata = new RequirementsMetadataDto
        {
            RequirementTypes = new List<MetadataOption>
            {
                new MetadataOption { Value = 0, Label = "Information" },
                new MetadataOption { Value = 1, Label = "Document" },
                new MetadataOption { Value = 2, Label = "Proof of Identity" },
                new MetadataOption { Value = 3, Label = "Proof of Address" },
                new MetadataOption { Value = 4, Label = "Ownership Structure" },
                new MetadataOption { Value = 5, Label = "Board Directors" },
                new MetadataOption { Value = 6, Label = "Authorized Signatories" }
            },
            FieldTypes = new List<MetadataOption>
            {
                new MetadataOption { Value = "Text", Label = "Text" },
                new MetadataOption { Value = "Email", Label = "Email" },
                new MetadataOption { Value = "Phone", Label = "Phone" },
                new MetadataOption { Value = "Number", Label = "Number" },
                new MetadataOption { Value = "Date", Label = "Date" },
                new MetadataOption { Value = "Select", Label = "Select" },
                new MetadataOption { Value = "MultiSelect", Label = "MultiSelect" },
                new MetadataOption { Value = "Radio", Label = "Radio" },
                new MetadataOption { Value = "Checkbox", Label = "Checkbox" },
                new MetadataOption { Value = "Textarea", Label = "Textarea" },
                new MetadataOption { Value = "File", Label = "File" },
                new MetadataOption { Value = "Country", Label = "Country" },
                new MetadataOption { Value = "Currency", Label = "Currency" },
                new MetadataOption { Value = "Address", Label = "Address" }
            }
        };

        return Ok(new
        {
            requirementTypes = metadata.RequirementTypes,
            fieldTypes = metadata.FieldTypes
        });
    }

    /// <summary>
    /// Create a new requirement
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateRequirementResult), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create(
        [FromBody] CreateRequirementRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new CreateRequirementCommand(
                request.Code,
                request.DisplayName,
                request.Description,
                request.Type,
                request.FieldType,
                request.ValidationRules,
                request.HelpText
            );

            var result = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot create requirement with code {Code}", request.Code);
            return BadRequest(new { 
                error = "Cannot create requirement", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating requirement");
            return StatusCode(500, new { 
                error = "An error occurred while creating the requirement", 
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Update an existing requirement
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UpdateRequirementResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateRequirementRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new UpdateRequirementCommand(
                id,
                request.DisplayName,
                request.Description,
                request.ValidationRules,
                request.HelpText,
                request.IsActive
            );

            var result = await _mediator.Send(command, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot update requirement {RequirementId}", id);
            return BadRequest(new { 
                error = "Cannot update requirement", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating requirement {RequirementId}", id);
            return StatusCode(500, new { 
                error = "An error occurred while updating the requirement", 
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Delete a requirement
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var command = new DeleteRequirementCommand(id);
            var result = await _mediator.Send(command, cancellationToken);

            if (!result)
                return NotFound(new { message = $"Requirement with ID '{id}' not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cannot delete requirement {RequirementId}", id);
            return BadRequest(new { 
                error = "Cannot delete requirement", 
                message = ex.Message 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting requirement {RequirementId}", id);
            return StatusCode(500, new { 
                error = "An error occurred while deleting the requirement", 
                message = ex.Message 
            });
        }
    }
}

public class CreateRequirementRequest
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string? ValidationRules { get; set; }
    public string? HelpText { get; set; }
}

public class UpdateRequirementRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ValidationRules { get; set; }
    public string? HelpText { get; set; }
    public bool? IsActive { get; set; }
}

public class RequirementsMetadataDto
{
    public List<MetadataOption> RequirementTypes { get; set; } = new();
    public List<MetadataOption> FieldTypes { get; set; } = new();
}

public class MetadataOption
{
    public object Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

