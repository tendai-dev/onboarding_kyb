using NotificationService.Application.Commands;
using NotificationService.Application.Queries;
using NotificationService.Domain.Aggregates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NotificationService.Presentation.Controllers;

[ApiController]
[Route("api/v1/notification-templates")]
#if !DEBUG
[Authorize]
#endif
public class NotificationTemplateController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<NotificationTemplateController> _logger;

    public NotificationTemplateController(IMediator mediator, ILogger<NotificationTemplateController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all notification templates
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationTemplateDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetTemplates([FromQuery] bool? activeOnly = null)
    {
        var result = await _mediator.Send(new GetNotificationTemplatesQuery(activeOnly));
        return Ok(result);
    }

    /// <summary>
    /// Get notification template by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NotificationTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> GetTemplate(Guid id)
    {
        var templates = await _mediator.Send(new GetNotificationTemplatesQuery(null));
        var template = templates.FirstOrDefault(t => t.Id == id);
        
        if (template == null)
            return NotFound();
        
        return Ok(template);
    }

    /// <summary>
    /// Create a new notification template
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateNotificationTemplateResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [AllowAnonymous]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateNotificationTemplateRequest request)
    {
        try
        {
            var command = new CreateNotificationTemplateCommand(
                request.Name,
                request.Description,
                request.Type,
                request.Channel,
                request.Subject,
                request.Content,
                request.Recipients ?? new List<string>(),
                request.Trigger,
                request.Priority ?? "Medium",
                request.Frequency ?? "Immediate",
                GetCurrentUser());

            var result = await _mediator.Send(command);
            return CreatedAtAction(
                nameof(GetTemplate),
                new { id = result.TemplateId },
                result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update a notification template
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UpdateNotificationTemplateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateNotificationTemplateRequest request)
    {
        try
        {
            var command = new UpdateNotificationTemplateCommand(
                id,
                request.Name,
                request.Description,
                request.Subject,
                request.Content,
                request.Recipients,
                request.Trigger,
                request.Priority,
                request.Frequency,
                request.IsActive);

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a notification template
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(DeleteNotificationTemplateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        try
        {
            var command = new DeleteNotificationTemplateCommand(id);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Send a test notification using a template
    /// </summary>
    [HttpPost("{id:guid}/test")]
    [ProducesResponseType(typeof(SendTestNotificationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> SendTestNotification(Guid id, [FromBody] SendTestNotificationRequest request)
    {
        try
        {
            var command = new SendTestNotificationCommand(id, request.TestRecipient);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test notification");
            return BadRequest(new { error = "Failed to send test notification", details = ex.Message });
        }
    }

    private string? GetCurrentUser()
    {
        return User.Identity?.Name ?? Request.Headers["X-User-Name"].FirstOrDefault();
    }
}

public class CreateNotificationTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string>? Recipients { get; set; }
    public string Trigger { get; set; } = string.Empty;
    public string? Priority { get; set; }
    public string? Frequency { get; set; }
}

public class UpdateNotificationTemplateRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Subject { get; set; }
    public string? Content { get; set; }
    public List<string>? Recipients { get; set; }
    public string? Trigger { get; set; }
    public string? Priority { get; set; }
    public string? Frequency { get; set; }
    public bool? IsActive { get; set; }
}

public class SendTestNotificationRequest
{
    public string TestRecipient { get; set; } = string.Empty;
}

