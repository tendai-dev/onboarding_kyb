using RiskService.Application.Commands;
using RiskService.Application.Queries;
using RiskService.Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RiskService.Presentation.Controllers;

[ApiController]
[Route("api/v1/risk-assessments")]
[Authorize]
public class RiskAssessmentController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<RiskAssessmentController> _logger;

    public RiskAssessmentController(IMediator mediator, ILogger<RiskAssessmentController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Create a new risk assessment for an onboarding case
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateRiskAssessmentResult), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateRiskAssessment([FromBody] CreateRiskAssessmentRequest request)
    {
        var command = new CreateRiskAssessmentCommand(request.CaseId, request.PartnerId);

        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(
                nameof(GetRiskAssessment),
                new { id = result.AssessmentId },
                result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get risk assessment by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRiskAssessment(Guid id)
    {
        var query = new GetRiskAssessmentQuery(id);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get risk assessment by case ID
    /// </summary>
    [HttpGet("case/{caseId}")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRiskAssessmentByCase(string caseId)
    {
        var query = new GetRiskAssessmentByCaseQuery(caseId);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Add a risk factor to an assessment
    /// </summary>
    [HttpPost("{assessmentId:guid}/factors")]
    [ProducesResponseType(typeof(AddRiskFactorResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddRiskFactor(
        Guid assessmentId,
        [FromBody] AddRiskFactorRequest request)
    {
        if (!Enum.TryParse<RiskFactorType>(request.Type, out var factorType))
            return BadRequest(new { error = $"Invalid risk factor type: {request.Type}" });

        if (!Enum.TryParse<RiskLevel>(request.Level, out var riskLevel))
            return BadRequest(new { error = $"Invalid risk level: {request.Level}" });

        var command = new AddRiskFactorCommand(
            assessmentId,
            factorType,
            riskLevel,
            request.Score,
            request.Description,
            request.Source);

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
    /// Complete a risk assessment
    /// </summary>
    [HttpPost("{assessmentId:guid}/complete")]
    [ProducesResponseType(typeof(CompleteRiskAssessmentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteRiskAssessment(
        Guid assessmentId,
        [FromBody] CompleteRiskAssessmentRequest request)
    {
        var command = new CompleteRiskAssessmentCommand(
            assessmentId,
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
        return Ok(new { status = "healthy", service = "risk-service", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get readiness status
    /// </summary>
    [HttpGet("/health/ready")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthReady()
    {
        return Ok(new { status = "ready", service = "risk-service", timestamp = DateTime.UtcNow });
    }

    private string GetCurrentUserId()
    {
        return User.Identity?.Name ?? "system";
    }
}

public class CreateRiskAssessmentRequest
{
    public string CaseId { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
}

public class AddRiskFactorRequest
{
    public string Type { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Source { get; set; }
}

public class CompleteRiskAssessmentRequest
{
    public string? Notes { get; set; }
}
