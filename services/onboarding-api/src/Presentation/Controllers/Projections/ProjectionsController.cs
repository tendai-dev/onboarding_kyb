using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Projections.Queries;
using OnboardingApi.Domain.Projections;
using OnboardingApi.Domain.Projections.ReadModels;

namespace OnboardingApi.Presentation.Controllers.Projections;

[ApiController]
[Route("api/v1/projections")]
public class ProjectionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProjectionsController> _logger;

    public ProjectionsController(IMediator mediator, ILogger<ProjectionsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard metrics and KPIs
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(DashboardProjection), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard([FromQuery] string? partnerId = null)
    {
        try
        {
            var query = new GetDashboardQuery(partnerId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard");
            return StatusCode(500, new { error = "Failed to get dashboard", message = ex.Message });
        }
    }

    /// <summary>
    /// Get onboarding cases with filters and pagination
    /// </summary>
    [HttpGet("cases")]
    [ProducesResponseType(typeof(PagedResult<OnboardingCaseProjection>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOnboardingCases(
        [FromQuery] string? partnerId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] bool? isOverdue = null,
        [FromQuery] bool? requiresManualReview = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var query = new GetOnboardingCasesQuery(
            partnerId,
            status,
            riskLevel,
            assignedTo,
            isOverdue,
            requiresManualReview,
            fromDate,
            toDate,
            searchTerm,
            sortBy,
            sortDirection,
            skip,
            take);

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get onboarding case by case ID
    /// </summary>
    [HttpGet("cases/{caseId}")]
    [ProducesResponseType(typeof(OnboardingCaseProjection), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOnboardingCase(string caseId)
    {
        var query = new GetOnboardingCaseQuery(caseId);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound(new { message = $"Case {caseId} not found" });

        return Ok(result);
    }

    /// <summary>
    /// Get cases requiring attention (high priority, overdue, manual review)
    /// </summary>
    [HttpGet("cases/requiring-attention")]
    [ProducesResponseType(typeof(List<OnboardingCaseProjection>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCasesRequiringAttention([FromQuery] string? partnerId = null)
    {
        var query = new GetCasesRequiringAttentionQuery(partnerId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get case statistics summary
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics([FromQuery] string? partnerId = null)
    {
        var dashboard = await _mediator.Send(new GetDashboardQuery(partnerId));
        
        return Ok(new
        {
            cases = dashboard.Cases,
            performance = dashboard.Performance,
            risk = dashboard.Risk,
            compliance = dashboard.Compliance,
            generatedAt = dashboard.GeneratedAt
        });
    }

    /// <summary>
    /// Get trends data for charts (last 30 days)
    /// </summary>
    [HttpGet("trends")]
    [ProducesResponseType(typeof(List<DailyMetric>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrends([FromQuery] string? partnerId = null)
    {
        var dashboard = await _mediator.Send(new GetDashboardQuery(partnerId));
        return Ok(dashboard.DailyTrends);
    }

    /// <summary>
    /// Get entity type distribution for charts
    /// </summary>
    [HttpGet("entity-type-distribution")]
    [ProducesResponseType(typeof(List<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEntityTypeDistribution([FromQuery] string? partnerId = null)
    {
        var dashboard = await _mediator.Send(new GetDashboardQuery(partnerId));
        
        var distribution = new[]
        {
            new { name = "Individual", value = dashboard.Cases.IndividualCases },
            new { name = "Corporate", value = dashboard.Cases.CorporateCases },
            new { name = "Trust", value = dashboard.Cases.TrustCases },
            new { name = "Partnership", value = dashboard.Cases.PartnershipCases }
        };

        return Ok(distribution);
    }
}

