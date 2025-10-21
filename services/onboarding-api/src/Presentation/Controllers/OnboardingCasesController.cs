using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Queries;
using OnboardingApi.Presentation.Filters;
using OnboardingApi.Presentation.Models;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Onboarding Cases API Controller
/// </summary>
[ApiController]
[Route("onboarding/v1/cases")]
[Authorize]
[Produces("application/json")]
[IdempotencyFilter]
public class OnboardingCasesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OnboardingCasesController> _logger;

    public OnboardingCasesController(IMediator mediator, ILogger<OnboardingCasesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Create a new onboarding case
    /// </summary>
    /// <param name="request">Onboarding case creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created onboarding case</returns>
    /// <response code="201">Onboarding case created successfully</response>
    /// <response code="400">Invalid request</response>
    /// <response code="401">Unauthorized</response>
    /// <response code="422">Validation errors</response>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OnboardingCaseResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateOnboardingCase(
        [FromBody] CreateOnboardingCaseRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";

        var command = new CreateOnboardingCaseCommand
        {
            Type = request.Type,
            PartnerId = request.PartnerId,
            PartnerReferenceId = request.PartnerReferenceId,
            Applicant = request.Applicant,
            Business = request.Business,
            CreatedBy = userId
        };

        var result = await _mediator.Send(command, cancellationToken);

        var response = new OnboardingCaseResponse
        {
            Id = result.CaseId,
            CaseNumber = result.CaseNumber
        };

        var requestId = HttpContext.Request.Headers["X-Request-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();

        return CreatedAtAction(
            nameof(GetOnboardingCase),
            new { id = result.CaseId },
            ApiResponse<OnboardingCaseResponse>.Success(response, requestId));
    }

    /// <summary>
    /// Get an onboarding case by ID
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Onboarding case details</returns>
    /// <response code="200">Onboarding case found</response>
    /// <response code="404">Onboarding case not found</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OnboardingCaseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOnboardingCase(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetOnboardingCaseQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result == null)
        {
            return NotFound(ErrorResponse.NotFound(
                "OnboardingCaseNotFound",
                $"Onboarding case with ID {id} was not found",
                HttpContext.Request.Headers["X-Request-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString()));
        }

        // Authorization check: user can only access their partner's cases
        var userPartnerId = User.FindFirst("partner_id")?.Value;
        if (userPartnerId != null && result.PartnerId.ToString() != userPartnerId)
        {
            return Forbid();
        }

        var requestId = HttpContext.Request.Headers["X-Request-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        return Ok(ApiResponse<OnboardingCaseDto>.Success(result, requestId));
    }

    /// <summary>
    /// Get health status
    /// </summary>
    [HttpGet("/health/live")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthLive()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get readiness status
    /// </summary>
    [HttpGet("/health/ready")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthReady()
    {
        try
        {
            // Basic readiness check - in production, add database/cache connectivity checks
            return Ok(new { 
                status = "ready", 
                service = "onboarding-api",
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { 
                status = "not ready", 
                error = ex.Message,
                timestamp = DateTime.UtcNow 
            });
        }
    }
}

