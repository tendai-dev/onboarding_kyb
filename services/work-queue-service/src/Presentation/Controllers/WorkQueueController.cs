using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkQueueService.Application.Commands;
using WorkQueueService.Application.Queries;
using MediatR;

namespace WorkQueueService.Presentation.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
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
        [FromQuery] WorkItemStatus? status = null,
        [FromQuery] Guid? assignedTo = null,
        [FromQuery] RiskLevel? riskLevel = null,
        [FromQuery] string? country = null,
        [FromQuery] bool? isOverdue = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetWorkItemsQuery(status, assignedTo, riskLevel, country, isOverdue, page, pageSize);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    /// <summary>
    /// Get work item by ID
    /// </summary>
    [HttpGet("{id}")]
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
    [Authorize(Roles = "ComplianceManager,Admin")]
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
    [HttpGet("{id}/history")]
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
    [HttpGet("{id}/comments")]
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
    [HttpPost("{id}/assign")]
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
    [HttpPost("{id}/unassign")]
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
    [HttpPost("{id}/start-review")]
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
    [HttpPost("{id}/submit-for-approval")]
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
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "ComplianceManager,Admin")]
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
    [HttpPost("{id}/complete")]
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
    /// Decline work item
    /// </summary>
    [HttpPost("{id}/decline")]
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
    [HttpPost("{id}/comments")]
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
    
    // Helper methods to extract user info from claims
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

