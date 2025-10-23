using ProjectionsApi.Application.Queries;
using ProjectionsApi.Domain.ReadModels;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectionsApi.Presentation.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
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
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboard([FromQuery] string? partnerId = null)
    {
        var query = new GetDashboardQuery(partnerId);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get paginated list of onboarding cases with filtering and sorting
    /// </summary>
    [HttpGet("cases")]
    [ProducesResponseType(typeof(PagedResult<OnboardingCaseProjection>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
        if (take > 1000)
            return BadRequest(new { error = "Take parameter cannot exceed 1000" });

        var query = new GetOnboardingCasesQuery(
            partnerId, status, riskLevel, assignedTo, isOverdue, requiresManualReview,
            fromDate, toDate, searchTerm, sortBy, sortDirection, skip, take);

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get specific onboarding case by case ID
    /// </summary>
    [HttpGet("cases/{caseId}")]
    [ProducesResponseType(typeof(OnboardingCaseProjection), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOnboardingCase(string caseId)
    {
        var query = new GetOnboardingCaseQuery(caseId);
        var result = await _mediator.Send(query);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get cases requiring immediate attention (high risk, overdue, compliance issues)
    /// </summary>
    [HttpGet("cases/attention")]
    [ProducesResponseType(typeof(List<OnboardingCaseProjection>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCasesRequiringAttention([FromQuery] string? partnerId = null)
    {
        // This would be implemented as a separate query in a full implementation
        var query = new GetOnboardingCasesQuery(
            PartnerId: partnerId,
            RequiresManualReview: true,
            Take: 50);

        var result = await _mediator.Send(query);
        return Ok(result.Items);
    }

    /// <summary>
    /// Get case statistics summary
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTrends([FromQuery] string? partnerId = null)
    {
        var dashboard = await _mediator.Send(new GetDashboardQuery(partnerId));
        return Ok(dashboard.DailyTrends);
    }

    /// <summary>
    /// Get recent activities for activity feed
    /// </summary>
    [HttpGet("activities")]
    [ProducesResponseType(typeof(List<RecentActivity>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRecentActivities([FromQuery] string? partnerId = null)
    {
        var dashboard = await _mediator.Send(new GetDashboardQuery(partnerId));
        return Ok(dashboard.RecentActivities);
    }

    /// <summary>
    /// Export cases to CSV
    /// </summary>
    [HttpGet("cases/export")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExportCases(
        [FromQuery] string? partnerId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var query = new GetOnboardingCasesQuery(
            PartnerId: partnerId, 
            Status: status, 
            RiskLevel: riskLevel, 
            Take: 10000); // Large limit for export

        var result = await _mediator.Send(query);
        
        var csv = GenerateCsv(result.Items);
        var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
        
        return File(bytes, "text/csv", $"onboarding_cases_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }

    /// <summary>
    /// Get health status
    /// </summary>
    [HttpGet("/health/live")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthLive()
    {
        return Ok(new { status = "healthy", service = "projections-api", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get readiness status
    /// </summary>
    [HttpGet("/health/ready")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult HealthReady()
    {
        return Ok(new { status = "ready", service = "projections-api", timestamp = DateTime.UtcNow });
    }

    private static string GenerateCsv(List<OnboardingCaseProjection> cases)
    {
        var csv = new System.Text.StringBuilder();
        
        // Header
        csv.AppendLine("CaseId,Type,Status,PartnerId,ApplicantName,ApplicantEmail,RiskLevel,RiskScore,Progress,CreatedAt,UpdatedAt");
        
        // Data
        foreach (var case_ in cases)
        {
            csv.AppendLine($"{case_.CaseId},{case_.Type},{case_.Status},{case_.PartnerId}," +
                          $"\"{case_.ApplicantFirstName} {case_.ApplicantLastName}\",{case_.ApplicantEmail}," +
                          $"{case_.RiskLevel},{case_.RiskScore},{case_.ProgressPercentage}," +
                          $"{case_.CreatedAt:yyyy-MM-dd HH:mm:ss},{case_.UpdatedAt:yyyy-MM-dd HH:mm:ss}");
        }
        
        return csv.ToString();
    }
}
