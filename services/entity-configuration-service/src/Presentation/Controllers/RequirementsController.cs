using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using EntityConfigurationService.Presentation.Models;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace EntityConfigurationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
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

        var dtos = requirements.Select(r => r.Adapt<RequirementDto>()).ToList();
        return Ok(dtos);
    }

    /// <summary>
    /// Get available requirement types and field types (metadata)
    /// </summary>
    [HttpGet("metadata")]
    [ProducesResponseType(typeof(object), 200)]
    public IActionResult GetMetadata()
    {
        // Requirement types with formatted labels
        var requirementTypeLabels = new Dictionary<Domain.Aggregates.RequirementType, string>
        {
            { Domain.Aggregates.RequirementType.Information, "Information" },
            { Domain.Aggregates.RequirementType.Document, "Document" },
            { Domain.Aggregates.RequirementType.ProofOfIdentity, "Proof of Identity" },
            { Domain.Aggregates.RequirementType.ProofOfAddress, "Proof of Address" },
            { Domain.Aggregates.RequirementType.OwnershipStructure, "Ownership Structure" },
            { Domain.Aggregates.RequirementType.BoardDirectors, "Board Directors" },
            { Domain.Aggregates.RequirementType.AuthorizedSignatories, "Authorized Signatories" }
        };

        var requirementTypes = Enum.GetValues(typeof(Domain.Aggregates.RequirementType))
            .Cast<Domain.Aggregates.RequirementType>()
            .Select(rt => new
            {
                value = (int)rt,
                label = requirementTypeLabels.GetValueOrDefault(rt, rt.ToString())
            })
            .ToList();

        // Field types
        var fieldTypes = new[]
        {
            new { value = "Text", label = "Text" },
            new { value = "Email", label = "Email" },
            new { value = "Phone", label = "Phone" },
            new { value = "Number", label = "Number" },
            new { value = "Date", label = "Date" },
            new { value = "Select", label = "Select" },
            new { value = "MultiSelect", label = "MultiSelect" },
            new { value = "Textarea", label = "Textarea" },
            new { value = "File", label = "File" }
        };

        return Ok(new
        {
            requirementTypes,
            fieldTypes
        });
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

        return Ok(requirement.Adapt<RequirementDto>());
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

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result
        );
    }

    /// <summary>
    /// Update a requirement
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

    /// <summary>
    /// Delete a requirement
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeleteRequirementCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Requirement with ID '{id}' not found" });

        return NoContent();
    }

    /// <summary>
    /// Get options for a requirement
    /// </summary>
    [HttpGet("{id}/options")]
    [ProducesResponseType(typeof(List<RequirementOptionDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetOptions(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetRequirementByIdQuery(id);
        var requirement = await _mediator.Send(query, cancellationToken);

        if (requirement == null)
            return NotFound(new { message = $"Requirement with ID '{id}' not found" });

        var optionDtos = requirement.Options.Select(o => o.Adapt<RequirementOptionDto>()).ToList();
        return Ok(optionDtos);
    }

    /// <summary>
    /// Add an option to a requirement
    /// </summary>
    [HttpPost("{id}/options")]
    [ProducesResponseType(typeof(RequirementOptionDto), 201)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddOption(Guid id, [FromBody] CreateRequirementOptionRequest request, CancellationToken cancellationToken = default)
    {
        var command = new AddRequirementOptionCommand(id, request.Value, request.DisplayText, request.DisplayOrder);
        var result = await _mediator.Send(command, cancellationToken);

        if (result == null)
            return NotFound(new { message = $"Requirement with ID '{id}' not found" });

        var dto = result.Adapt<RequirementOptionDto>();
        return CreatedAtAction(nameof(GetOptions), new { id }, dto);
    }

    /// <summary>
    /// Update a requirement option
    /// </summary>
    [HttpPut("{id}/options/{optionId}")]
    [ProducesResponseType(typeof(RequirementOptionDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateOption(Guid id, Guid optionId, [FromBody] UpdateRequirementOptionRequest request, CancellationToken cancellationToken = default)
    {
        var command = new UpdateRequirementOptionCommand(id, optionId, request.Value, request.DisplayText, request.DisplayOrder);
        var result = await _mediator.Send(command, cancellationToken);

        if (result == null)
            return NotFound(new { message = $"Option with ID '{optionId}' not found for requirement '{id}'" });

        var dto = result.Adapt<RequirementOptionDto>();
        return Ok(dto);
    }

    /// <summary>
    /// Delete a requirement option
    /// </summary>
    [HttpDelete("{id}/options/{optionId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteOption(Guid id, Guid optionId, CancellationToken cancellationToken = default)
    {
        var command = new DeleteRequirementOptionCommand(id, optionId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
            return NotFound(new { message = $"Option with ID '{optionId}' not found for requirement '{id}'" });

        return NoContent();
    }
}
