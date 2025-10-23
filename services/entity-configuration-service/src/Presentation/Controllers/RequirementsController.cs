using EntityConfigurationService.Application.Commands;
using EntityConfigurationService.Application.Queries;
using EntityConfigurationService.Presentation.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

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

        var dtos = requirements.Select(RequirementDto.FromDomain).ToList();
        return Ok(dtos);
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
            "GetById",
            "EntityTypes",
            new { id = result.Id },
            result
        );
    }
}
