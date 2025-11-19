using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using WorkQueueService.Application.Commands;
using WorkQueueService.Application.Queries;
using MediatR;
using System.Net.Http;
using System.Net.Http.Json;

namespace WorkQueueService.Presentation.Controllers;

[ApiController]
[Route("api/v1/workqueue")]
public class WorkQueueController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<WorkQueueController> _logger;
    private readonly IWebHostEnvironment _env;
    
    public WorkQueueController(IMediator mediator, ILogger<WorkQueueController> logger, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _logger = logger;
        _env = env;
    }
    
    /// <summary>
    /// Get all work items with optional filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<WorkItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkItems(
        [FromQuery] WorkItemStatus? status = null,
        [FromQuery] Guid? assignedTo = null,
        [FromQuery] RiskLevel? riskLevel = null,
        [FromQuery] string? country = null,
        [FromQuery] bool? isOverdue = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetWorkItemsQuery(status, assignedTo, riskLevel, country, isOverdue, searchTerm, page, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Get work item by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkItemById(Guid id)
    {
        var query = new GetWorkItemByIdQuery(id);
        var result = await _mediator.Send(query);
        
        if (result == null)
            return NotFound(new { message = $"Work item not found: {id}" });
        
        return Ok(result);
    }
    
    /// <summary>
    /// Get my assigned work items
    /// </summary>
    [HttpGet("my-items")]
    [ProducesResponseType(typeof(PagedResult<WorkItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyWorkItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var query = new GetMyWorkItemsQuery(userId, page, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Get pending approvals (for compliance managers)
    /// </summary>
    [HttpGet("pending-approvals")]
    [ProducesResponseType(typeof(PagedResult<WorkItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingApprovals(
        [FromQuery] RiskLevel? minimumRiskLevel = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetPendingApprovalsQuery(minimumRiskLevel, page, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Get items due for refresh
    /// </summary>
    [HttpGet("due-for-refresh")]
    [ProducesResponseType(typeof(PagedResult<WorkItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetItemsDueForRefresh(
        [FromQuery] DateTime? asOfDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetItemsDueForRefreshQuery(asOfDate, page, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Get work item history
    /// </summary>
    [HttpGet("{id:guid}/history")]
    [ProducesResponseType(typeof(List<WorkItemHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(Guid id)
    {
        var query = new GetWorkItemHistoryQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Get work item comments
    /// </summary>
    [HttpGet("{id:guid}/comments")]
    [ProducesResponseType(typeof(List<WorkItemCommentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(Guid id)
    {
        var query = new GetWorkItemCommentsQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Assign work item to user
    /// </summary>
    [HttpPost("{id:guid}/assign")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignWorkItem(Guid id, [FromBody] AssignWorkItemRequest request)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new AssignWorkItemCommand(
            id, 
            request.AssignedToUserId, 
            request.AssignedToUserName, 
            currentUserId);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item assigned successfully" });
    }
    
    /// <summary>
    /// Unassign work item
    /// </summary>
    [HttpPost("{id:guid}/unassign")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnassignWorkItem(Guid id)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new UnassignWorkItemCommand(id, currentUserId);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item unassigned successfully" });
    }
    
    /// <summary>
    /// Start review on work item
    /// </summary>
    [HttpPost("{id:guid}/start-review")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartReview(Guid id)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new StartReviewCommand(id, currentUserId);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Review started successfully" });
    }
    
    /// <summary>
    /// Submit work item for approval
    /// </summary>
    [HttpPost("{id:guid}/submit-for-approval")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitForApproval(Guid id, [FromBody] SubmitForApprovalRequest request)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new SubmitForApprovalCommand(id, currentUserId, request.Notes);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item submitted for approval" });
    }
    
    /// <summary>
    /// Approve work item (requires ComplianceManager role for high-risk items)
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ApproveWorkItem(Guid id, [FromBody] ApproveWorkItemRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserName = GetCurrentUserName();
        var currentUserRole = GetCurrentUserRole();
        
        var command = new ApproveWorkItemCommand(
            id, 
            currentUserId, 
            currentUserName, 
            currentUserRole, 
            request.Notes);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item approved successfully" });
    }
    
    /// <summary>
    /// Complete work item
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteWorkItem(Guid id, [FromBody] CompleteWorkItemRequest request)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new CompleteWorkItemCommand(id, currentUserId, request.Notes);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item completed successfully" });
    }
    
    /// <summary>
    /// Mark work item for refresh
    /// </summary>
    [HttpPost("{id:guid}/mark-for-refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkForRefresh(Guid id)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new MarkForRefreshCommand(id, currentUserId);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item marked for refresh successfully" });
    }
    
    /// <summary>
    /// Decline work item
    /// </summary>
    [HttpPost("{id:guid}/decline")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeclineWorkItem(Guid id, [FromBody] DeclineWorkItemRequest request)
    {
        var currentUserId = GetCurrentUserIdString();
        var command = new DeclineWorkItemCommand(id, currentUserId, request.Reason);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Work item declined" });
    }
    
    /// <summary>
    /// Add comment to work item
    /// </summary>
    [HttpPost("{id:guid}/comments")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] AddCommentRequest request)
    {
        var currentUserId = GetCurrentUserIdString();
        var currentUserName = GetCurrentUserName();
        
        var command = new AddCommentCommand(id, request.Text, currentUserId, currentUserName);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return CreatedAtAction(nameof(GetComments), new { id }, new { commentId = result.CommentId });
    }
    
    /// <summary>
    /// Sync work items from existing onboarding cases (creates work items for cases that don't have them)
    /// </summary>
    [HttpPost("sync-from-onboarding")]
    [ProducesResponseType(typeof(SyncWorkItemsResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous] // Allow in development
    public async Task<IActionResult> SyncFromOnboarding([FromQuery] bool forceRecreate = false)
    {
        try
        {
            _logger.LogInformation("Starting work items sync from onboarding cases (forceRecreate: {ForceRecreate})", forceRecreate);
            
            // Use the Case API URL from environment variable
            var onboardingApiUrl = Environment.GetEnvironmentVariable("ONBOARDING_API_URL") 
                ?? Environment.GetEnvironmentVariable("ONBOARDING_API_BASE_URL")
                ?? Environment.GetEnvironmentVariable("CaseApi__BaseUrl")
                ?? "http://kyb_case_api:8001";
            
            _logger.LogInformation("Using onboarding API URL: {OnboardingApiUrl}", onboardingApiUrl);
            
            var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            // Add development authentication headers for service-to-service communication
            httpClient.DefaultRequestHeaders.Add("X-User-Email", "work-queue-service@system.local");
            httpClient.DefaultRequestHeaders.Add("X-User-Name", "Work Queue Service");
            httpClient.DefaultRequestHeaders.Add("X-User-Role", "admin");
            
            // Fetch all onboarding cases from the Case API
            HttpResponseMessage? casesResponse = null;
            try
            {
                casesResponse = await httpClient.GetAsync($"{onboardingApiUrl}/api/v1/cases?take=1000");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to connect to {Url}, trying alternative URL", onboardingApiUrl);
                // Try alternative URL format with container name
                onboardingApiUrl = "http://kyb_case_api:8001";
                casesResponse = await httpClient.GetAsync($"{onboardingApiUrl}/api/v1/cases?take=1000");
            }
            if (!casesResponse.IsSuccessStatusCode)
            {
                var errorContent = await casesResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to fetch onboarding cases. Status: {Status}, Response: {Response}", 
                    casesResponse.StatusCode, errorContent);
                return StatusCode(500, new { 
                    error = "Failed to fetch onboarding cases", 
                    message = casesResponse.ReasonPhrase,
                    statusCode = (int)casesResponse.StatusCode,
                    details = errorContent
                });
            }
            
            var jsonContent = await casesResponse.Content.ReadAsStringAsync();
            var casesData = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(jsonContent);
            
            if (!casesData.TryGetProperty("items", out var itemsArray))
            {
                return StatusCode(500, new { error = "Invalid response format from onboarding API - missing 'items' property" });
            }
            
            // Get all existing work items to check which cases already have work items
            var existingWorkItemsQuery = new GetWorkItemsQuery(null, null, null, null, null, null, 1, 10000);
            var existingWorkItemsResult = await _mediator.Send(existingWorkItemsQuery);
            var existingApplicationIds = existingWorkItemsResult.Items.Select(wi => wi.ApplicationId).ToHashSet();
            
            var created = 0;
            var updated = 0;
            var errors = 0;
            var skipped = 0;
            
            foreach (var caseItem in itemsArray.EnumerateArray())
            {
                try
                {
                    // Get case ID - handle both camelCase and snake_case
                    string? caseIdStr = null;
                    if (caseItem.TryGetProperty("caseId", out var caseIdElement))
                        caseIdStr = caseIdElement.GetString();
                    else if (caseItem.TryGetProperty("case_id", out var caseIdElement2))
                        caseIdStr = caseIdElement2.GetString();
                    
                    if (string.IsNullOrEmpty(caseIdStr) || !Guid.TryParse(caseIdStr, out var caseId))
                        continue;
                    
                    // Check if work item already exists
                    if (!forceRecreate && existingApplicationIds.Contains(caseId))
                    {
                        skipped++;
                        continue;
                    }
                    
                    // Get applicant name - handle both camelCase and snake_case
                    var firstName = caseItem.TryGetProperty("applicantFirstName", out var fn) ? fn.GetString() 
                        : (caseItem.TryGetProperty("applicant_first_name", out var fn2) ? fn2.GetString() : "");
                    var lastName = caseItem.TryGetProperty("applicantLastName", out var ln) ? ln.GetString()
                        : (caseItem.TryGetProperty("applicant_last_name", out var ln2) ? ln2.GetString() : "");
                    var businessLegalName = caseItem.TryGetProperty("businessLegalName", out var bln) ? bln.GetString()
                        : (caseItem.TryGetProperty("business_legal_name", out var bln2) ? bln2.GetString() : null);
                    
                    var applicantName = !string.IsNullOrEmpty(businessLegalName)
                        ? businessLegalName
                        : $"{firstName} {lastName}".Trim();
                    
                    if (string.IsNullOrEmpty(applicantName))
                        applicantName = "Unknown Applicant";
                    
                    // Get entity type
                    var entityType = caseItem.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : "Individual";
                    if (string.IsNullOrEmpty(entityType))
                        entityType = "Individual";
                    
                    // Get country - handle both camelCase and snake_case
                    var country = caseItem.TryGetProperty("applicantCountry", out var countryEl) ? countryEl.GetString()
                        : (caseItem.TryGetProperty("applicant_country", out var countryEl2) ? countryEl2.GetString() : "Unknown");
                    if (string.IsNullOrEmpty(country))
                        country = "Unknown";
                    
                    // Default risk level (Medium)
                    var riskLevel = "Medium";
                    
                    // Create work item
                    var createCommand = new CreateWorkItemCommand(
                        ApplicationId: caseId,
                        ApplicantName: applicantName,
                        EntityType: entityType,
                        Country: country,
                        RiskLevel: riskLevel,
                        CreatedBy: "sync-service"
                    );
                    
                    var result = await _mediator.Send(createCommand);
                    
                    if (result.Success)
                    {
                        created++;
                        var caseNumber = caseItem.TryGetProperty("caseNumber", out var cn) ? cn.GetString() : "N/A";
                        _logger.LogInformation("Created work item for case {CaseId} ({CaseNumber})", caseId, caseNumber);
                    }
                    else
                    {
                        errors++;
                        _logger.LogWarning("Failed to create work item for case {CaseId}: {Error}", caseId, result.ErrorMessage);
                    }
                }
                catch (Exception ex)
                {
                    errors++;
                    _logger.LogError(ex, "Error processing case during sync");
                }
            }
            
            _logger.LogInformation("Work items sync completed: Created={Created}, Skipped={Skipped}, Errors={Errors}", created, skipped, errors);
            
            return Ok(new SyncWorkItemsResult
            {
                Created = created,
                Updated = updated,
                Skipped = skipped,
                Errors = errors,
                Message = $"Sync completed: {created} created, {skipped} skipped, {errors} errors"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during work items sync");
            return StatusCode(500, new { error = "Sync failed", message = ex.Message });
        }
    }
    
    // Helper methods to extract user info from claims
    private Guid GetCurrentUserId()
    {
        if (User?.Identity?.IsAuthenticated != true)
        {
            // Return a default GUID for development when not authenticated
            return Guid.Parse("00000000-0000-0000-0000-000000000001");
        }
        var userIdClaim = User.FindFirst("sub") ?? User.FindFirst("oid") ?? User.FindFirst("user_id");
        return Guid.TryParse(userIdClaim?.Value, out var userId) ? userId : Guid.Empty;
    }
    
    private string GetCurrentUserIdString()
    {
        return GetCurrentUserId().ToString();
    }
    
    private string GetCurrentUserName()
    {
        if (User?.Identity?.IsAuthenticated != true)
        {
            return "System User";
        }
        return User.FindFirst("name")?.Value ?? 
               User.FindFirst("preferred_username")?.Value ?? 
               "Unknown";
    }
    
    private string GetCurrentUserRole()
    {
        if (User?.Identity?.IsAuthenticated != true)
        {
            return "Admin"; // Default role for development
        }
        var roles = User.FindAll("role").Select(c => c.Value).ToList();
        if (roles.Contains("Admin")) return "Admin";
        if (roles.Contains("ComplianceManager")) return "ComplianceManager";
        if (roles.Contains("Reviewer")) return "Reviewer";
        return "User";
    }
}

// Request DTOs
public record AssignWorkItemRequest(Guid AssignedToUserId, string AssignedToUserName);
public record SubmitForApprovalRequest(string? Notes);
public record ApproveWorkItemRequest(string? Notes);
public record CompleteWorkItemRequest(string? Notes);
public record DeclineWorkItemRequest(string Reason);
public record AddCommentRequest(string Text);

// Response DTOs
public record SyncWorkItemsResult
{
    public int Created { get; init; }
    public int Updated { get; init; }
    public int Skipped { get; init; }
    public int Errors { get; init; }
    public string? Message { get; init; }
}

