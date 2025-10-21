using ChecklistService.Application.Commands;
using ChecklistService.Application.Queries;
using ChecklistService.Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChecklistService.Presentation.Controllers;

[ApiController]
[Route("api/v1/checklists")]
[Authorize]
public class ChecklistController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ChecklistController> _logger;

    public ChecklistController(IMediator mediator, ILogger<ChecklistController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Create a new checklist for an onboarding case
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateChecklistResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateChecklist([FromBody] CreateChecklistRequest request)
    {
        var command = new CreateChecklistCommand(
            request.CaseId,
            Enum.Parse<ChecklistType>(request.Type),
            request.PartnerId);

        var result = await _mediator.Send(command);

        return CreatedAtAction(
            nameof(GetChecklist),
            new { id = result.ChecklistId },
            result);
    }

    /// <summary>
    /// Get checklist by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ChecklistDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetChecklist(Guid id)
    {
        var query = new GetChecklistQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get checklist by case ID
    /// </summary>
    [HttpGet("case/{caseId}")]
    [ProducesResponseType(typeof(ChecklistDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetChecklistByCase(string caseId)
    {
        var query = new GetChecklistByCaseQuery(caseId);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Complete a checklist item
    /// </summary>
    [HttpPost("{checklistId:guid}/items/{itemId:guid}/complete")]
    [ProducesResponseType(typeof(CompleteChecklistItemResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteChecklistItem(
        Guid checklistId,
        Guid itemId,
        [FromBody] CompleteChecklistItemRequest request)
    {
        var command = new CompleteChecklistItemCommand(
            checklistId,
            itemId,
            GetCurrentUserId(),
            request.Notes);

        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get health status
    /// </summary>
    [HttpGet("/health/live")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthLive()
    {
        return Ok(new { status = "healthy", service = "checklist-service", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get readiness status
    /// </summary>
    [HttpGet("/health/ready")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthReady()
    {
        return Ok(new { status = "ready", service = "checklist-service", timestamp = DateTime.UtcNow });
    }

    private string GetCurrentUserId()
    {
        return User.Identity?.Name ?? "system";
    }
}

public class CreateChecklistRequest
{
    public string CaseId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
}

public class CompleteChecklistItemRequest
{
    public string? Notes { get; set; }
}
