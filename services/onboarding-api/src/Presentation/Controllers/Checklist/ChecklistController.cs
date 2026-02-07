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
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateChecklist([FromBody] CreateChecklistRequest request)
    {
        // Check if a checklist already exists for this case
        var existingQuery = new GetChecklistByCaseQuery(request.CaseId);
        var existing = await _mediator.Send(existingQuery);
        if (existing != null)
        {
            return Conflict(new { 
                error = "A checklist already exists for this case",
                message = $"A checklist already exists for case '{request.CaseId}'. Each case can only have one checklist.",
                existingChecklistId = existing.Id
            });
        }

        // Try to parse as enum first, otherwise default to Corporate for custom entity types
        if (!Enum.TryParse<ChecklistType>(request.Type, out var type))
        {
            // Map common entity type codes to ChecklistType
            type = request.Type?.ToUpperInvariant() switch
            {
                "INDIVIDUAL" or "PERSON" or "NATURAL_PERSON" => ChecklistType.Individual,
                "TRUST" => ChecklistType.Trust,
                "PARTNERSHIP" => ChecklistType.Partnership,
                _ => ChecklistType.Corporate // Default to Corporate for business entity types
            };
            _logger.LogInformation("Mapped entity type '{EntityType}' to ChecklistType '{ChecklistType}'", request.Type, type);
        }

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
    /// SECURITY: Requires authentication
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ChecklistDto>), StatusCodes.Status200OK)]
    [Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Require authentication
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
    /// Delete a checklist
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteChecklist(Guid id)
    {
        var command = new DeleteChecklistCommand(id);
        var result = await _mediator.Send(command);

        if (!result)
            return NotFound();

        return NoContent();
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

    /// <summary>
    /// Update a checklist (add/remove items, change status)
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ChecklistDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateChecklist(Guid id, [FromBody] UpdateChecklistRequest request)
    {
        try
        {
            var command = new UpdateChecklistCommand(
                id,
                request.Type,
                request.Status,
                request.Items?.Select(i => new UpdateChecklistItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Category = i.Category,
                    IsRequired = i.IsRequired,
                    Order = i.Order,
                    Notes = i.Notes
                }).ToList()
            );

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Checklist not found" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Add an item to a checklist
    /// </summary>
    [HttpPost("{checklistId:guid}/items")]
    [ProducesResponseType(typeof(ChecklistDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddChecklistItem(Guid checklistId, [FromBody] AddChecklistItemRequest request)
    {
        try
        {
            var command = new AddChecklistItemCommand(
                checklistId,
                request.Name,
                request.Description,
                request.Category,
                request.IsRequired,
                request.Notes
            );

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Checklist not found" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Remove an item from a checklist
    /// </summary>
    [HttpDelete("{checklistId:guid}/items/{itemId:guid}")]
    [ProducesResponseType(typeof(ChecklistDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveChecklistItem(Guid checklistId, Guid itemId)
    {
        try
        {
            var command = new RemoveChecklistItemCommand(checklistId, itemId);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Checklist or item not found" });
        }
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

public class UpdateChecklistRequest
{
    public string? Type { get; set; }
    public string? Status { get; set; }
    public List<UpdateChecklistItemRequest>? Items { get; set; }
}

public class UpdateChecklistItemRequest
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int Order { get; set; }
    public string? Notes { get; set; }
}

public class AddChecklistItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string? Notes { get; set; }
}

