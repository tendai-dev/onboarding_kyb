using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Projections.Interfaces;
using OnboardingApi.Application.WorkQueue.Commands;
using OnboardingApi.Application.WorkQueue.Queries;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Controllers.WorkQueue;

[ApiController]
[Route("api/v1/workqueue")]
public class WorkQueueController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<WorkQueueController> _logger;
    private readonly IWorkItemRepository _workItemRepository;
    private readonly IOnboardingCaseRepository _caseRepository;
    private readonly IProjectionRepository _projectionRepository;
    
    public WorkQueueController(
        IMediator mediator, 
        ILogger<WorkQueueController> logger,
        IWorkItemRepository workItemRepository,
        IOnboardingCaseRepository caseRepository,
        IProjectionRepository projectionRepository)
    {
        _mediator = mediator;
        _logger = logger;
        _workItemRepository = workItemRepository;
        _caseRepository = caseRepository;
        _projectionRepository = projectionRepository;
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
    /// Get work item by application ID
    /// This route must come before the generic {id:guid} route to avoid routing conflicts
    /// </summary>
    [HttpGet("by-application/{applicationId:guid}")]
    [ProducesResponseType(typeof(WorkItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkItemByApplicationId(Guid applicationId)
    {
        var query = new GetWorkItemByApplicationIdQuery(applicationId);
        var result = await _mediator.Send(query);
        
        if (result == null)
            return NotFound(new { message = $"Work item not found for application: {applicationId}" });
        
        return Ok(result);
    }
    
    /// <summary>
    /// Get step review status for work item
    /// This route must come before the generic {id:guid} route to avoid routing conflicts
    /// </summary>
    [HttpGet("{id:guid}/step-review")]
    [ProducesResponseType(typeof(Dictionary<string, StepReviewStatusDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStepReviewStatus(Guid id)
    {
        var query = new GetStepReviewStatusQuery(id);
        var result = await _mediator.Send(query);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(result.StepReviews ?? new Dictionary<string, StepReviewStatusDto>());
    }
    
    /// <summary>
    /// Update step review status
    /// This route must come before the generic {id:guid} route to avoid routing conflicts
    /// </summary>
    [HttpPut("{id:guid}/step-review/{stepId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateStepReviewStatus(
        Guid id, 
        string stepId,
        [FromBody] UpdateStepReviewStatusRequest request)
    {
        var currentUserId = GetCurrentUserIdString();
        var currentUserName = GetCurrentUserName();
        
        var command = new UpdateStepReviewStatusCommand(
            id,
            stepId,
            request.Field,
            request.Value,
            currentUserId,
            currentUserName,
            request.Notes);
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { message = "Step review status updated successfully" });
    }
    
    /// <summary>
    /// Get work item by ID (also supports lookup by application ID as fallback)
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkItemById(Guid id)
    {
        // First try to find by work item ID
        var query = new GetWorkItemByIdQuery(id);
        var result = await _mediator.Send(query);
        
        // If not found, try to find by application ID as fallback
        if (result == null)
        {
            var appQuery = new GetWorkItemByApplicationIdQuery(id);
            result = await _mediator.Send(appQuery);
        }
        
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
    /// Update work item priority
    /// </summary>
    [HttpPost("{id:guid}/update-priority")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePriority(Guid id, [FromBody] UpdatePriorityRequest request)
    {
        try
        {
            // Parse priority first
            if (!Enum.TryParse<WorkItemPriority>(request.Priority, true, out var priority))
            {
                return BadRequest(new { error = $"Invalid priority: {request.Priority}. Valid values: Low, Medium, High, Critical" });
            }

            var currentUserId = GetCurrentUserIdString();
            
            // Use direct update to avoid concurrency issues
            var rowsAffected = await _workItemRepository.UpdatePriorityAsync(id, priority, currentUserId, HttpContext.RequestAborted);
            
            if (rowsAffected == 0)
                return NotFound(new { error = $"Work item {id} not found" });

            _logger.LogInformation("Work item {WorkItemId} priority updated to {Priority} by {UserId}", 
                id, priority, currentUserId);

            return Ok(new { message = "Priority updated successfully", priority = priority.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating priority for work item {WorkItemId}", id);
            return StatusCode(500, new { error = "Failed to update priority", details = ex.Message });
        }
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
    
    /// <summary>
    /// Create work item for a case (internal use - called automatically when case is submitted)
    /// SECURITY: Requires authentication even for internal use
    /// </summary>
    [HttpPost("create")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Require authentication
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateWorkItem([FromBody] CreateWorkItemRequest request)
    {
        var command = new CreateWorkItemCommand(
            request.ApplicationId,
            request.ApplicantName,
            null, // BusinessName - not provided in request
            request.EntityType,
            request.Country,
            request.RiskLevel,
            request.CreatedBy,
            request.SlaDays
        );
        
        var result = await _mediator.Send(command);
        
        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });
        
        return Ok(new { workItemId = result.WorkItemId, message = "Work item created successfully" });
    }

    /// <summary>
    /// Clean up orphaned work items (work items that reference deleted cases/applications)
    /// </summary>
    [HttpPost("cleanup/orphaned")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CleanupOrphanedWorkItems(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting cleanup of orphaned work items...");
            
            // Get all work items
            var allWorkItems = await _workItemRepository.GetAllAsync(
                status: null,
                assignedTo: null,
                riskLevel: null,
                country: null,
                isOverdue: null,
                searchTerm: null,
                cancellationToken);
            
            var orphanedCount = 0;
            var orphanedWorkItems = new List<Guid>();
            
            // Check each work item to see if its ApplicationId exists
            foreach (var workItem in allWorkItems)
            {
                var caseExists = await _caseRepository.GetByIdAsync(workItem.ApplicationId, cancellationToken);
                if (caseExists == null)
                {
                    // This work item references a non-existent case - it's orphaned
                    orphanedWorkItems.Add(workItem.Id);
                    orphanedCount++;
                    _logger.LogWarning("Found orphaned work item {WorkItemId} referencing deleted case {ApplicationId}", 
                        workItem.Id, workItem.ApplicationId);
                }
            }
            
            // Delete orphaned work items
            foreach (var workItemId in orphanedWorkItems)
            {
                var workItem = await _workItemRepository.GetByIdAsync(workItemId, cancellationToken);
                if (workItem != null)
                {
                    await _workItemRepository.DeleteAsync(workItem, cancellationToken);
                }
            }
            
            if (orphanedCount > 0)
            {
                await _workItemRepository.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Deleted {Count} orphaned work items", orphanedCount);
            }
            
            return Ok(new 
            { 
                message = "Cleanup completed",
                orphanedCount = orphanedCount,
                deletedWorkItems = orphanedWorkItems
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up orphaned work items");
            return StatusCode(500, new { error = "Failed to cleanup orphaned work items", details = ex.Message });
        }
    }

    /// <summary>
    /// Create missing work items for submitted cases that don't have work items
    /// </summary>
    [HttpPost("sync/missing")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateMissingWorkItems(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting sync of missing work items for submitted cases...");
            
            // Get all cases (we'll filter for submitted ones)
            // Note: This is a simplified approach - in production you might want to add a query for submitted cases only
            var allCases = await _caseRepository.GetByPartnerIdWithFiltersAsync(
                partnerId: Guid.Empty, // This won't work - we need a different approach
                limit: 10000,
                offset: 0,
                status: "Submitted",
                assignee: null,
                cancellationToken);
            
            // Actually, we need to get all cases and filter manually since GetByPartnerIdWithFiltersAsync requires a partnerId
            // Let's use a different approach - we'll need to add a method to get all submitted cases
            // For now, let's get work items and see which cases are missing
            
            var allWorkItems = await _workItemRepository.GetAllAsync(
                status: null,
                assignedTo: null,
                riskLevel: null,
                country: null,
                isOverdue: null,
                searchTerm: null,
                cancellationToken);
            
            var existingApplicationIds = new HashSet<Guid>(
                allWorkItems.Select(w => w.ApplicationId));
            
            // We need a way to get all submitted cases
            // Since we don't have a direct method, let's create work items for cases that are submitted
            // but don't have work items. We'll need to check each case individually.
            
            // For now, return a message that this needs to be implemented with a proper query
            // The user can manually trigger work item creation for specific cases
            
            return Ok(new 
            { 
                message = "To create missing work items, please use the case creation endpoint which automatically creates work items for submitted cases. " +
                         "Alternatively, you can query all submitted cases and check which ones don't have work items.",
                note = "This endpoint needs a method to query all submitted cases. For now, work items are created automatically when cases are submitted."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing missing work items");
            return StatusCode(500, new { error = "Failed to sync missing work items", details = ex.Message });
        }
    }

    /// <summary>
    /// Create work item for a specific case/application ID (if it doesn't exist)
    /// </summary>
    [HttpPost("sync/case/{caseId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateWorkItemForCase(Guid caseId, CancellationToken cancellationToken)
    {
        try
        {
            // Check if case exists
            var caseEntity = await _caseRepository.GetByIdAsync(caseId, cancellationToken);
            if (caseEntity == null)
            {
                return NotFound(new { error = $"Case {caseId} not found" });
            }
            
            // Check if case is submitted
            if (caseEntity.Status != OnboardingStatus.Submitted)
            {
                return BadRequest(new { error = $"Case {caseId} is not in Submitted status. Current status: {caseEntity.Status}" });
            }
            
            // Check if work item already exists
            var existingWorkItem = await _workItemRepository.GetByApplicationIdAsync(caseId, cancellationToken);
            if (existingWorkItem != null)
            {
                return Ok(new { message = $"Work item already exists for case {caseId}", workItemId = existingWorkItem.Id });
            }
            
            // Extract applicant name
            var applicantName = $"{caseEntity.Applicant.FirstName} {caseEntity.Applicant.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(applicantName) && caseEntity.Business != null)
            {
                applicantName = caseEntity.Business.LegalName ?? "Unknown";
            }
            if (string.IsNullOrWhiteSpace(applicantName))
            {
                applicantName = "Unknown Applicant";
            }

            // Extract entity type
            var entityType = caseEntity.Type == OnboardingType.Business ? "Business" : "Individual";
            if (caseEntity.Metadata != null && caseEntity.Metadata.TryGetValue("entity_type_code", out var entityTypeCode))
            {
                entityType = entityTypeCode;
            }

            // Extract country
            var country = caseEntity.Applicant?.ResidentialAddress?.Country ?? 
                         caseEntity.Business?.RegisteredAddress?.Country ?? 
                         "Unknown";

            // Create work item
            var command = new CreateWorkItemCommand(
                ApplicationId: caseId,
                ApplicantName: applicantName,
                BusinessName: caseEntity.Business?.LegalName,
                EntityType: entityType,
                Country: country,
                RiskLevel: "Unknown",
                CreatedBy: caseEntity.CreatedBy,
                SlaDays: 5
            );

            var result = await _mediator.Send(command, cancellationToken);
            
            if (result.Success)
            {
                _logger.LogInformation("Created work item {WorkItemId} for case {CaseId}", result.WorkItemId, caseId);
                return Ok(new { workItemId = result.WorkItemId, message = "Work item created successfully" });
            }
            else
            {
                return BadRequest(new { error = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating work item for case {CaseId}", caseId);
            return StatusCode(500, new { error = "Failed to create work item", details = ex.Message });
        }
    }

    /// <summary>
    /// Sync all work item assignments to case projections (backfill existing assignments)
    /// </summary>
    [HttpPost("sync/assignments")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncAssignmentsToCaseProjections(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting sync of work item assignments to case projections...");
            
            // Get all work items that have assignments
            var allWorkItems = await _workItemRepository.GetAllAsync(
                status: null,
                assignedTo: null,
                riskLevel: null,
                country: null,
                isOverdue: null,
                searchTerm: null,
                cancellationToken);
            
            var syncedCount = 0;
            var failedCount = 0;
            var skippedCount = 0;
            var syncedItems = new List<object>();
            
            foreach (var workItem in allWorkItems)
            {
                // Only sync items that have an assignment
                if (workItem.AssignedTo == null)
                {
                    skippedCount++;
                    continue;
                }
                
                try
                {
                    var rowsAffected = await _projectionRepository.UpdateCaseAssigneeAsync(
                        workItem.ApplicationId,
                        workItem.AssignedTo.ToString(),
                        workItem.AssignedToName,
                        cancellationToken);
                    
                    if (rowsAffected > 0)
                    {
                        syncedCount++;
                        syncedItems.Add(new 
                        { 
                            workItemId = workItem.Id, 
                            applicationId = workItem.ApplicationId,
                            assignedTo = workItem.AssignedToName 
                        });
                        _logger.LogInformation(
                            "Synced assignment for case {CaseId}: {AssignedTo}",
                            workItem.ApplicationId, workItem.AssignedToName);
                    }
                    else
                    {
                        // Case projection might not exist
                        skippedCount++;
                        _logger.LogWarning(
                            "Case projection not found for ApplicationId {ApplicationId}",
                            workItem.ApplicationId);
                    }
                }
                catch (Exception ex)
                {
                    failedCount++;
                    _logger.LogError(ex, 
                        "Failed to sync assignment for case {CaseId}",
                        workItem.ApplicationId);
                }
            }
            
            _logger.LogInformation(
                "Assignment sync completed: {SyncedCount} synced, {SkippedCount} skipped, {FailedCount} failed",
                syncedCount, skippedCount, failedCount);
            
            return Ok(new 
            { 
                message = "Assignment sync completed",
                syncedCount,
                skippedCount,
                failedCount,
                syncedItems
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing assignments to case projections");
            return StatusCode(500, new { error = "Failed to sync assignments", details = ex.Message });
        }
    }

    /// <summary>
    /// Sync all work item statuses to case projections (backfill existing statuses)
    /// </summary>
    [HttpPost("sync/statuses")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncStatusesToCaseProjections(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting sync of work item statuses to case projections...");
            
            // Get all work items
            var allWorkItems = await _workItemRepository.GetAllAsync(
                status: null,
                assignedTo: null,
                riskLevel: null,
                country: null,
                isOverdue: null,
                searchTerm: null,
                cancellationToken);
            
            var syncedCount = 0;
            var failedCount = 0;
            var skippedCount = 0;
            var syncedItems = new List<object>();
            
            foreach (var workItem in allWorkItems)
            {
                // Map work item status to case projection status (frontend expected values)
                string? caseStatus = workItem.Status switch
                {
                    WorkItemStatus.New => null, // Keep as SUBMITTED
                    WorkItemStatus.Assigned => null, // Keep as SUBMITTED
                    WorkItemStatus.InProgress => "IN_PROGRESS",
                    WorkItemStatus.PendingApproval => "RISK_REVIEW",
                    WorkItemStatus.Approved => "COMPLETE",
                    WorkItemStatus.Completed => "COMPLETE",
                    WorkItemStatus.Declined => "DECLINED",
                    WorkItemStatus.Cancelled => "DECLINED",
                    _ => null
                };
                
                if (caseStatus == null)
                {
                    skippedCount++;
                    continue;
                }
                
                try
                {
                    var rowsAffected = await _projectionRepository.UpdateCaseStatusAsync(
                        workItem.ApplicationId,
                        caseStatus,
                        cancellationToken);
                    
                    if (rowsAffected > 0)
                    {
                        syncedCount++;
                        syncedItems.Add(new 
                        { 
                            workItemId = workItem.Id, 
                            applicationId = workItem.ApplicationId,
                            workItemStatus = workItem.Status.ToString(),
                            caseStatus = caseStatus
                        });
                        _logger.LogInformation(
                            "Synced status for case {CaseId}: {WorkItemStatus} -> {CaseStatus}",
                            workItem.ApplicationId, workItem.Status, caseStatus);
                    }
                    else
                    {
                        skippedCount++;
                        _logger.LogWarning(
                            "Case projection not found for ApplicationId {ApplicationId}",
                            workItem.ApplicationId);
                    }
                }
                catch (Exception ex)
                {
                    failedCount++;
                    _logger.LogError(ex, 
                        "Failed to sync status for case {CaseId}",
                        workItem.ApplicationId);
                }
            }
            
            _logger.LogInformation(
                "Status sync completed: {SyncedCount} synced, {SkippedCount} skipped, {FailedCount} failed",
                syncedCount, skippedCount, failedCount);
            
            return Ok(new 
            { 
                message = "Status sync completed",
                syncedCount,
                skippedCount,
                failedCount,
                syncedItems
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing statuses to case projections");
            return StatusCode(500, new { error = "Failed to sync statuses", details = ex.Message });
        }
    }
}

// Request DTOs
public record CreateWorkItemRequest(
    Guid ApplicationId,
    string ApplicantName,
    string EntityType,
    string Country,
    string RiskLevel,
    string CreatedBy,
    int SlaDays = 5
);
public record AssignWorkItemRequest(Guid AssignedToUserId, string AssignedToUserName);
public record SubmitForApprovalRequest(string? Notes);
public record ApproveWorkItemRequest(string? Notes);
public record CompleteWorkItemRequest(string? Notes);
public record DeclineWorkItemRequest(string Reason);
public record AddCommentRequest(string Text);
public record UpdateStepReviewStatusRequest(string Field, bool Value, string? Notes = null);
public record UpdatePriorityRequest(string Priority);

