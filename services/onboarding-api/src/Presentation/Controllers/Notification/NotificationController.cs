using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Notification.Commands;
using OnboardingApi.Application.Notification.Queries;
using OnboardingApi.Domain.Notification.ValueObjects;

namespace OnboardingApi.Presentation.Controllers.Notification;

[ApiController]
[Route("api/v1/notifications")]
public class NotificationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(IMediator mediator, ILogger<NotificationController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Send a notification (email, SMS, etc.)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SendNotificationResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
    {
        if (!Enum.TryParse<NotificationType>(request.Type, out var type))
            return BadRequest(new { error = $"Invalid notification type: {request.Type}" });

        if (!Enum.TryParse<NotificationChannel>(request.Channel, out var channel))
            return BadRequest(new { error = $"Invalid notification channel: {request.Channel}" });

        if (!Enum.TryParse<NotificationPriority>(request.Priority, out var priority))
            return BadRequest(new { error = $"Invalid notification priority: {request.Priority}" });

        var command = new SendNotificationCommand(
            type,
            channel,
            request.Recipient,
            request.Subject,
            request.Content,
            priority,
            request.CaseId,
            request.PartnerId,
            request.TemplateId,
            request.TemplateData,
            request.ScheduledAt);

        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(
                nameof(GetNotification),
                new { id = result.NotificationId },
                result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification");
            return BadRequest(new { error = "Failed to send notification" });
        }
    }

    /// <summary>
    /// Send welcome email for new onboarding case
    /// </summary>
    [HttpPost("welcome")]
    [ProducesResponseType(typeof(SendNotificationResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendWelcomeNotification([FromBody] WelcomeNotificationRequest request)
    {
        var content = $@"
Dear {request.ApplicantName},

Welcome to our onboarding process! Your application has been received and assigned case ID: {request.CaseId}.

We will guide you through the following steps:
1. Identity verification
2. Document upload
3. Compliance review
4. Final approval

You can track your progress at any time using your case ID.

Best regards,
The Onboarding Team";

        var command = new SendNotificationCommand(
            NotificationType.Welcome,
            NotificationChannel.Email,
            request.Email,
            $"Welcome - Your Onboarding Case {request.CaseId}",
            content,
            NotificationPriority.Medium,
            request.CaseId,
            request.PartnerId);

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetNotification), new { id = result.NotificationId }, result);
    }

    /// <summary>
    /// Send status update notification
    /// </summary>
    [HttpPost("status-update")]
    [ProducesResponseType(typeof(SendNotificationResult), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendStatusUpdate([FromBody] StatusUpdateNotificationRequest request)
    {
        var content = $@"
Dear {request.ApplicantName},

Your onboarding case {request.CaseId} status has been updated to: {request.NewStatus}

{request.Message}

Best regards,
The Onboarding Team";

        var command = new SendNotificationCommand(
            NotificationType.StatusUpdate,
            NotificationChannel.Email,
            request.Email,
            $"Status Update - Case {request.CaseId}",
            content,
            NotificationPriority.Medium,
            request.CaseId,
            request.PartnerId);

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetNotification), new { id = result.NotificationId }, result);
    }

    /// <summary>
    /// List all notifications
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllNotifications()
    {
        var result = await _mediator.Send(new GetAllNotificationsQuery());
        return Ok(result);
    }

    /// <summary>
    /// List notifications by case id
    /// </summary>
    [HttpGet("case/{caseId}")]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> ListByCase(string caseId)
    {
        var result = await _mediator.Send(new GetNotificationsByCaseQuery(caseId));
        return Ok(result);
    }

    /// <summary>
    /// List notifications by status
    /// </summary>
    [HttpGet("status/{status}")]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public async Task<IActionResult> ListByStatus(string status)
    {
        var result = await _mediator.Send(new GetNotificationsByStatusQuery(status));
        return Ok(result);
    }

    /// <summary>
    /// Get notification by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NotificationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> GetNotification(Guid id)
    {
        // Simplified - would use a GetNotificationQuery in production
        return Ok(new { id, status = "sent", message = "Notification details would be returned here" });
    }
}

public class SendNotificationRequest
{
    public string Type { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public string? CaseId { get; set; }
    public string? PartnerId { get; set; }
    public string? TemplateId { get; set; }
    public Dictionary<string, object>? TemplateData { get; set; }
    public DateTime? ScheduledAt { get; set; }
}

public class WelcomeNotificationRequest
{
    public string CaseId { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
    public string ApplicantName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class StatusUpdateNotificationRequest
{
    public string CaseId { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
    public string ApplicantName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

