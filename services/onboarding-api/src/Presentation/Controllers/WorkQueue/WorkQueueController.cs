using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.WorkQueue.Commands;
using OnboardingApi.Application.WorkQueue.Queries;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Controllers.WorkQueue;

[ApiController]
[Route("api/v1/workqueue")]
public class WorkQueueController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<WorkQueueController> _logger;
    
    public WorkQueueController(IMediator mediator, ILogger<WorkQueueController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }
    
    /// <summary>
    /// Get all work items with optional filters
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<WorkItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkItems(
        [FromQuery] string? status = null,
        [FromQuery] Guid? assignedTo = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] string? country = null,
        [FromQuery] bool? isOverdue = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        WorkItemStatus? statusEnum = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkItemStatus>(status, true, out var parsedStatus))
            statusEnum = parsedStatus;

        RiskLevel? riskLevelEnum = null;
        if (!string.IsNullOrWhiteSpace(riskLevel) && Enum.TryParse<RiskLevel>(riskLevel, true, out var parsedRisk))
            riskLevelEnum = parsedRisk;

        var query = new GetWorkItemsQuery(statusEnum, assignedTo, riskLevelEnum, country, isOverdue, searchTerm, page, pageSize);
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
        [FromQuery] string? minimumRiskLevel = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        RiskLevel? riskLevelEnum = null;
        if (!string.IsNullOrWhiteSpace(minimumRiskLevel) && Enum.TryParse<RiskLevel>(minimumRiskLevel, true, out var parsedRisk))
            riskLevelEnum = parsedRisk;

        var query = new GetPendingApprovalsQuery(riskLevelEnum, page, pageSize);
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
    
    // Helper methods
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub") ?? User.FindFirst("oid") ?? User.FindFirst("user_id");
        return Guid.TryParse(userIdClaim?.Value, out var userId) ? userId : Guid.Empty;
    }
    
    private string GetCurrentUserIdString()
    {
        return GetCurrentUserId().ToString();
    }
    
    private string GetCurrentUserName()
    {
        return User.FindFirst("name")?.Value ?? 
               User.FindFirst("preferred_username")?.Value ?? 
               "Unknown";
    }
    
    private string GetCurrentUserRole()
    {
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

