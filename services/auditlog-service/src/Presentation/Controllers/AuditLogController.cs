using AuditLogService.Application.Commands;
using AuditLogService.Application.Interfaces;
using AuditLogService.Application.Queries;
using AuditLogService.Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditLogService.Presentation.Controllers;

[ApiController]
[Route("api/v1/audit-logs")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AuditLogController> _logger;

    public AuditLogController(IMediator mediator, ILogger<AuditLogController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Create a new audit log entry
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateAuditLogEntryResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateAuditLogEntry([FromBody] CreateAuditLogEntryRequest request)
    {
        if (!Enum.TryParse<AuditAction>(request.Action, out var action))
            return BadRequest(new { error = $"Invalid audit action: {request.Action}" });

        if (!Enum.TryParse<AuditSeverity>(request.Severity, out var severity))
            return BadRequest(new { error = $"Invalid audit severity: {request.Severity}" });

        if (!Enum.TryParse<ComplianceCategory>(request.ComplianceCategory, out var category))
            return BadRequest(new { error = $"Invalid compliance category: {request.ComplianceCategory}" });

        var command = new CreateAuditLogEntryCommand(
            request.EventType,
            request.EntityType,
            request.EntityId,
            GetCurrentUserId(),
            GetCurrentUserRole(),
            action,
            request.Description,
            GetClientIpAddress(),
            GetUserAgent(),
            request.CaseId,
            request.PartnerId,
            request.OldValues,
            request.NewValues,
            request.CorrelationId,
            severity,
            category);

        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(
                nameof(GetAuditLogEntry),
                new { id = result.EntryId },
                result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit log entry");
            return BadRequest(new { error = "Failed to create audit log entry" });
        }
    }

    /// <summary>
    /// Get audit log entry by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuditLogEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAuditLogEntry(Guid id)
    {
        var query = new GetAuditLogQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get audit logs for a specific entity
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId}")]
    [ProducesResponseType(typeof(List<AuditLogEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAuditLogsByEntity(string entityType, string entityId)
    {
        var query = new GetAuditLogsByEntityQuery(entityType, entityId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get audit logs for a specific case
    /// </summary>
    [HttpGet("case/{caseId}")]
    [ProducesResponseType(typeof(List<AuditLogEntryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAuditLogsByCase(string caseId)
    {
        var query = new GetAuditLogsByCaseQuery(caseId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Search audit logs with criteria
    /// </summary>
    [HttpPost("search")]
    [ProducesResponseType(typeof(AuditLogSearchResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SearchAuditLogs([FromBody] AuditLogSearchRequest request)
    {
        var criteria = new AuditLogSearchCriteria
        {
            EventType = request.EventType,
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            CaseId = request.CaseId,
            PartnerId = request.PartnerId,
            UserId = request.UserId,
            Action = !string.IsNullOrEmpty(request.Action) && Enum.TryParse<AuditAction>(request.Action, out var action) ? action : null,
            Severity = !string.IsNullOrEmpty(request.Severity) && Enum.TryParse<AuditSeverity>(request.Severity, out var severity) ? severity : null,
            ComplianceCategory = !string.IsNullOrEmpty(request.ComplianceCategory) && Enum.TryParse<ComplianceCategory>(request.ComplianceCategory, out var category) ? category : null,
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            Skip = request.Skip,
            Take = Math.Min(request.Take, 1000) // Limit to prevent abuse
        };

        var query = new SearchAuditLogsQuery(criteria);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get health status
    /// </summary>
    [HttpGet("/health/live")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthLive()
    {
        return Ok(new { status = "healthy", service = "auditlog-service", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get readiness status
    /// </summary>
    [HttpGet("/health/ready")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthReady()
    {
        return Ok(new { status = "ready", service = "auditlog-service", timestamp = DateTime.UtcNow });
    }

    private string GetCurrentUserId()
    {
        return User.Identity?.Name ?? "system";
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst("role")?.Value ?? "unknown";
    }

    private string GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private string GetUserAgent()
    {
        return Request.Headers.UserAgent.ToString() ?? "unknown";
    }
}

public class CreateAuditLogEntryRequest
{
    public string EventType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? CaseId { get; set; }
    public string? PartnerId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public object? OldValues { get; set; }
    public object? NewValues { get; set; }
    public string? CorrelationId { get; set; }
    public string Severity { get; set; } = "Medium";
    public string ComplianceCategory { get; set; } = "General";
}

public class AuditLogSearchRequest
{
    public string? EventType { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? CaseId { get; set; }
    public string? PartnerId { get; set; }
    public string? UserId { get; set; }
    public string? Action { get; set; }
    public string? Severity { get; set; }
    public string? ComplianceCategory { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 100;
}
