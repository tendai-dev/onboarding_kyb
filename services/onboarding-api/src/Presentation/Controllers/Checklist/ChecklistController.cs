using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Checklist.Commands;
using OnboardingApi.Application.Checklist.Queries;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Presentation.Controllers.Checklist;

[ApiController]
[Route("api/v1/checklists")]
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
        if (!Enum.TryParse<ChecklistType>(request.Type, out var type))
            return BadRequest(new { error = $"Invalid checklist type: {request.Type}" });

        var command = new CreateChecklistCommand(
            request.CaseId,
            type,
            request.PartnerId);

        var result = await _mediator.Send(command);

        return CreatedAtAction(
            nameof(GetChecklist),
            new { id = result.ChecklistId },
            result);
    }

    /// <summary>
    /// List all checklists
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ChecklistDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllChecklists()
    {
        var query = new GetAllChecklistsQuery();
        var result = await _mediator.Send(query);
        return Ok(result);
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
    /// List checklists by partner id
    /// </summary>
    [HttpGet("partner/{partnerId}")]
    [ProducesResponseType(typeof(IEnumerable<ChecklistDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByPartner(string partnerId)
    {
        var query = new GetChecklistsByPartnerQuery(partnerId);
        var result = await _mediator.Send(query);
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
    /// Skip a checklist item (non-required only)
    /// </summary>
    [HttpPost("{checklistId:guid}/items/{itemId:guid}/skip")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SkipChecklistItem(
        Guid checklistId,
        Guid itemId,
        [FromBody] SkipChecklistItemRequest request)
    {
        var command = new SkipChecklistItemCommand(
            checklistId,
            itemId,
            GetCurrentUserId(),
            request.Reason ?? "No reason provided");

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
    /// Reset a checklist item to pending
    /// </summary>
    [HttpPost("{checklistId:guid}/items/{itemId:guid}/reset")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResetChecklistItem(
        Guid checklistId,
        Guid itemId,
        [FromBody] ResetChecklistItemRequest request)
    {
        var command = new ResetChecklistItemCommand(
            checklistId,
            itemId,
            GetCurrentUserId(),
            request.Reason ?? "Reset requested");

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
    /// Get checklist progress summary
    /// </summary>
    [HttpGet("{checklistId:guid}/progress")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProgress(Guid checklistId)
    {
        var result = await _mediator.Send(new GetChecklistProgressQuery(checklistId));
        return Ok(result);
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

public class SkipChecklistItemRequest
{
    public string? Reason { get; set; }
}

public class ResetChecklistItemRequest
{
    public string? Reason { get; set; }
}

