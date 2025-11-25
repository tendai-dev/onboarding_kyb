using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Queries;
using OnboardingApi.Domain.Risk.ValueObjects;

namespace OnboardingApi.Presentation.Controllers.Risk;

[ApiController]
[Route("api/v1/risk-assessments")]
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
    /// Update a risk factor
    /// </summary>
    [HttpPut("{assessmentId:guid}/factors/{factorId:guid}")]
    [ProducesResponseType(typeof(UpdateRiskFactorResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRiskFactor(
        Guid assessmentId,
        Guid factorId,
        [FromBody] UpdateRiskFactorRequest request)
    {
        if (!Enum.TryParse<RiskLevel>(request.Level, out var riskLevel))
            return BadRequest(new { error = $"Invalid risk level: {request.Level}" });

        var command = new UpdateRiskFactorCommand(
            assessmentId,
            factorId,
            riskLevel,
            request.Score,
            request.Description);

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
    /// List risk factors for an assessment
    /// </summary>
    [HttpGet("{assessmentId:guid}/factors")]
    [ProducesResponseType(typeof(IEnumerable<RiskFactorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRiskFactors(Guid assessmentId)
    {
        var result = await _mediator.Send(new GetRiskFactorsQuery(assessmentId));
        return Ok(result);
    }

    /// <summary>
    /// Reject a risk assessment
    /// </summary>
    [HttpPost("{assessmentId:guid}/reject")]
    [ProducesResponseType(typeof(RejectRiskAssessmentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RejectRiskAssessment(
        Guid assessmentId,
        [FromBody] RejectRiskAssessmentRequest request)
    {
        var command = new RejectRiskAssessmentCommand(assessmentId, GetCurrentUserId(), request.Reason);
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
    /// Update risk assessment notes without completing (for draft saves)
    /// </summary>
    [HttpPut("{assessmentId:guid}/notes")]
    [ProducesResponseType(typeof(UpdateRiskAssessmentNotesResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRiskAssessmentNotes(
        Guid assessmentId,
        [FromBody] UpdateRiskAssessmentNotesRequest request)
    {
        var command = new UpdateRiskAssessmentNotesCommand(
            assessmentId,
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
    /// Complete a risk assessment
    /// </summary>
    [HttpPost("{assessmentId:guid}/complete")]
    [ProducesResponseType(typeof(CompleteRiskAssessmentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
    /// Manually set the risk level for an assessment (Admin decision after review)
    /// </summary>
    [HttpPost("{assessmentId:guid}/set-risk-level")]
    [ProducesResponseType(typeof(SetManualRiskLevelResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetManualRiskLevel(
        Guid assessmentId,
        [FromBody] SetManualRiskLevelRequest request)
    {
        if (!Enum.TryParse<RiskLevel>(request.RiskLevel, out var riskLevel))
            return BadRequest(new { error = $"Invalid risk level: {request.RiskLevel}" });

        if (string.IsNullOrWhiteSpace(request.Justification))
            return BadRequest(new { error = "Justification is required for manual risk determination" });

        var command = new SetManualRiskLevelCommand(
            assessmentId,
            riskLevel,
            GetCurrentUserId(),
            request.Justification);

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
    /// List or search risk assessments
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RiskAssessmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRiskAssessments(
        [FromQuery] string? partnerId = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? status = null,
        [FromQuery] string? caseId = null)
    {
        var query = new SearchRiskAssessmentsQuery(partnerId, riskLevel, status, caseId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    private string GetCurrentUserId()
    {
        return User.Identity?.Name ?? User.FindFirst("sub")?.Value ?? "system";
    }
}

// Request DTOs
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

public class UpdateRiskFactorRequest
{
    public string Level { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class RejectRiskAssessmentRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class CompleteRiskAssessmentRequest
{
    public string? Notes { get; set; }
}

public class SetManualRiskLevelRequest
{
    public string RiskLevel { get; set; } = string.Empty;
    public string Justification { get; set; } = string.Empty;
}

public class UpdateRiskAssessmentNotesRequest
{
    public string? Notes { get; set; }
}

