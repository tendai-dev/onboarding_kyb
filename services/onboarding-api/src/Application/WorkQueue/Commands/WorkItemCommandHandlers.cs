using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Projections.Interfaces;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.Enums;
using OnboardingApi.Domain.WorkQueue.ValueObjects;

namespace OnboardingApi.Application.WorkQueue.Commands;

public class CreateWorkItemCommandHandler : IRequestHandler<CreateWorkItemCommand, CreateWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<CreateWorkItemCommandHandler> _logger;

    public CreateWorkItemCommandHandler(IWorkItemRepository repository, ILogger<CreateWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<CreateWorkItemResult> Handle(CreateWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Check if work item already exists for this application
            var existing = await _repository.GetByApplicationIdAsync(request.ApplicationId, cancellationToken);
            if (existing != null)
                return CreateWorkItemResult.Failed("Work item already exists for this application");

            // Parse risk level
            if (!Enum.TryParse<RiskLevel>(request.RiskLevel, true, out var riskLevel))
                riskLevel = RiskLevel.Unknown;

            var workItem = WorkItem.Create(
                request.ApplicationId,
                request.ApplicantName,
                request.BusinessName,
                request.EntityType,
                request.Country,
                riskLevel,
                request.CreatedBy,
                request.SlaDays);

            await _repository.AddAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            return CreateWorkItemResult.Successful(workItem.Id, workItem.WorkItemNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating work item");
            return CreateWorkItemResult.Failed(ex.Message);
        }
    }
}

public class AssignWorkItemCommandHandler : IRequestHandler<AssignWorkItemCommand, AssignWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<AssignWorkItemCommandHandler> _logger;

    public AssignWorkItemCommandHandler(
        IWorkItemRepository repository, 
        IProjectionRepository projectionRepository,
        ILogger<AssignWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<AssignWorkItemResult> Handle(AssignWorkItemCommand request, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        int attempt = 0;
        Guid? applicationId = null;
        
        while (attempt < maxRetries)
        {
            try
            {
                attempt++;
                _logger.LogDebug("Assigning work item {WorkItemId}, attempt {Attempt}", request.WorkItemId, attempt);
                
                // Load entity to check status and get previous assignee for history
                var workItem = await _repository.GetByIdForUpdateAsync(request.WorkItemId, cancellationToken);
                if (workItem == null)
                    return AssignWorkItemResult.Failed("Work item not found");

                // Check if already completed
                if (workItem.IsCompleted)
                    return AssignWorkItemResult.Failed("Cannot assign completed work item");

                // Store values before assignment for history
                var previousAssignee = workItem.AssignedToName;
                var currentStatus = workItem.Status.ToString();
                applicationId = workItem.ApplicationId;
                
                // Use ExecuteUpdate to update the work item directly in the database
                // This bypasses change tracking and avoids concurrency issues
                var rowsAffected = await _repository.UpdateAssignmentDirectlyAsync(
                    request.WorkItemId,
                    request.AssignedToUserId,
                    request.AssignedToUserName,
                    request.AssignedByUserId,
                    cancellationToken);
                
                if (rowsAffected == 0)
                {
                    // Entity might have been deleted or doesn't exist
                    return AssignWorkItemResult.Failed("Work item not found or has been deleted");
                }
                
                // Add history entry separately using raw SQL to avoid owned collection issues
                await _repository.AddHistoryEntryAsync(
                    request.WorkItemId,
                    $"Assigned to {request.AssignedToUserName}" + 
                    (previousAssignee != null ? $" (previously: {previousAssignee})" : ""),
                    request.AssignedToUserName,
                    currentStatus,
                    cancellationToken);
                
                // Sync assignment to case projection so Applications screen shows same assignee
                if (applicationId.HasValue)
                {
                    try
                    {
                        await _projectionRepository.UpdateCaseAssigneeAsync(
                            applicationId.Value,
                            request.AssignedToUserId.ToString(),
                            request.AssignedToUserName,
                            cancellationToken);
                        
                        _logger.LogInformation(
                            "Synced assignment to case projection: CaseId={CaseId}, AssignedTo={AssignedTo}",
                            applicationId.Value, request.AssignedToUserName);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the work item assignment if projection sync fails
                        _logger.LogWarning(ex, 
                            "Failed to sync assignment to case projection for CaseId={CaseId}. Work item assignment succeeded.",
                            applicationId.Value);
                    }
                }
                
                _logger.LogInformation(
                    "Work item {WorkItemId} assigned to user {UserId} ({UserName}) on attempt {Attempt}",
                    request.WorkItemId,
                    request.AssignedToUserId,
                    request.AssignedToUserName,
                    attempt);
                
                return AssignWorkItemResult.Successful();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("completed"))
            {
                _logger.LogWarning("Cannot assign completed work item {WorkItemId}", request.WorkItemId);
                return AssignWorkItemResult.Failed(ex.Message);
            }
            catch (Exception ex) when ((ex.Message.Contains("concurrency") || ex.Message.Contains("expected to affect")) && attempt < maxRetries)
            {
                _logger.LogWarning(ex, "Concurrency conflict assigning work item {WorkItemId} on attempt {Attempt}. Retrying...", 
                    request.WorkItemId, attempt);
                
                // Wait a bit before retry to allow any concurrent operations to complete
                await Task.Delay(100 * attempt, cancellationToken);
                
                // Continue to retry
                continue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning work item {WorkItemId} on attempt {Attempt}", request.WorkItemId, attempt);
                return AssignWorkItemResult.Failed(ex.Message);
            }
        }
        
        return AssignWorkItemResult.Failed("Failed to assign work item after multiple retries due to concurrency conflicts");
    }
}

public class UnassignWorkItemCommandHandler : IRequestHandler<UnassignWorkItemCommand, UnassignWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<UnassignWorkItemCommandHandler> _logger;

    public UnassignWorkItemCommandHandler(
        IWorkItemRepository repository,
        IProjectionRepository projectionRepository,
        ILogger<UnassignWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<UnassignWorkItemResult> Handle(UnassignWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // First check if work item exists and get applicationId
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return UnassignWorkItemResult.Failed("Work item not found");

            // Check if already unassigned
            if (workItem.AssignedTo == null)
                return UnassignWorkItemResult.Failed("Work item is not currently assigned");

            var applicationId = workItem.ApplicationId;
            var previousAssignee = workItem.AssignedToName;
            
            // Use direct database update to avoid EF Core concurrency issues with owned collections
            var rowsAffected = await _repository.UnassignDirectlyAsync(request.WorkItemId, request.UnassignedByUserId, cancellationToken);
            
            if (rowsAffected == 0)
                return UnassignWorkItemResult.Failed("Work item could not be unassigned - it may have already been unassigned");
            
            // Add history entry - use previousAssignee as the performer since that's who was unassigned
            await _repository.AddHistoryEntryAsync(
                request.WorkItemId, 
                $"Unassigned from {previousAssignee}", 
                previousAssignee ?? "System", 
                "New", 
                cancellationToken);
            
            // Sync unassignment to case projection
            try
            {
                await _projectionRepository.UpdateCaseAssigneeAsync(
                    applicationId,
                    null,
                    null,
                    cancellationToken);
                
                _logger.LogInformation(
                    "Synced unassignment to case projection: CaseId={CaseId}",
                    applicationId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, 
                    "Failed to sync unassignment to case projection for CaseId={CaseId}. Work item unassignment succeeded.",
                    applicationId);
            }
            
            return UnassignWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            return UnassignWorkItemResult.Failed(ex.Message);
        }
    }
}

public class StartReviewCommandHandler : IRequestHandler<StartReviewCommand, StartReviewResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<StartReviewCommandHandler> _logger;

    public StartReviewCommandHandler(
        IWorkItemRepository repository,
        IProjectionRepository projectionRepository,
        ILogger<StartReviewCommandHandler> logger)
    {
        _repository = repository;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<StartReviewResult> Handle(StartReviewCommand request, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        int attempt = 0;
        Guid? applicationId = null;
        
        while (attempt < maxRetries)
        {
            try
            {
                attempt++;
                _logger.LogDebug("Starting review for work item {WorkItemId}, attempt {Attempt}", request.WorkItemId, attempt);
                
                // Check if work item exists and is in correct status
                var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
                if (workItem == null)
                    return StartReviewResult.Failed("Work item not found");

                if (workItem.AssignedTo == null)
                    return StartReviewResult.Failed("Work item must be assigned before review");

                if (workItem.Status != WorkItemStatus.Assigned)
                    return StartReviewResult.Failed($"Cannot start review from status: {workItem.Status}");

                applicationId = workItem.ApplicationId;

                // Use ExecuteUpdate to update the work item directly in the database
                // This bypasses change tracking and avoids concurrency issues
                var rowsAffected = await _repository.UpdateStatusDirectlyAsync(
                    request.WorkItemId,
                    WorkItemStatus.InProgress,
                    request.ReviewedByUserId,
                    cancellationToken);
                
                if (rowsAffected == 0)
                {
                    // Entity might have been deleted or status changed
                    return StartReviewResult.Failed("Work item not found or status has changed");
                }
                
                // Add history entry separately using raw SQL to avoid owned collection issues
                await _repository.AddHistoryEntryAsync(
                    request.WorkItemId,
                    "Review started",
                    request.ReviewedByUserId,
                    WorkItemStatus.InProgress.ToString(),
                    cancellationToken);
                
                // Sync status to case projection: InProgress -> "IN_PROGRESS" (frontend expected value)
                if (applicationId.HasValue)
                {
                    try
                    {
                        await _projectionRepository.UpdateCaseStatusAsync(
                            applicationId.Value,
                            "IN_PROGRESS",
                            cancellationToken);
                        _logger.LogInformation("Synced status to case projection: CaseId={CaseId}, Status=IN_PROGRESS", applicationId.Value);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to sync status to case projection for CaseId={CaseId}", applicationId.Value);
                    }
                }
                
                _logger.LogInformation(
                    "Work item {WorkItemId} review started by {UserId} on attempt {Attempt}",
                    request.WorkItemId,
                    request.ReviewedByUserId,
                    attempt);
                
                return StartReviewResult.Successful();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("assigned") || ex.Message.Contains("status"))
            {
                _logger.LogWarning("Cannot start review for work item {WorkItemId}: {Message}", request.WorkItemId, ex.Message);
                return StartReviewResult.Failed(ex.Message);
            }
            catch (Exception ex) when ((ex.Message.Contains("concurrency") || ex.Message.Contains("expected to affect")) && attempt < maxRetries)
            {
                _logger.LogWarning(ex, "Concurrency conflict starting review for work item {WorkItemId} on attempt {Attempt}. Retrying...", 
                    request.WorkItemId, attempt);
                
                // Wait a bit before retry to allow any concurrent operations to complete
                await Task.Delay(100 * attempt, cancellationToken);
                
                // Continue to retry
                continue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting review for work item {WorkItemId} on attempt {Attempt}", request.WorkItemId, attempt);
                return StartReviewResult.Failed(ex.Message);
            }
        }
        
        return StartReviewResult.Failed("Failed to start review after multiple retries due to concurrency conflicts");
    }
}

public class SubmitForApprovalCommandHandler : IRequestHandler<SubmitForApprovalCommand, SubmitForApprovalResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<SubmitForApprovalCommandHandler> _logger;

    public SubmitForApprovalCommandHandler(
        IWorkItemRepository repository,
        ILogger<SubmitForApprovalCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<SubmitForApprovalResult> Handle(SubmitForApprovalCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate work item exists and is in correct status
            var workItem = await _repository.GetByIdForUpdateAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return SubmitForApprovalResult.Failed("Work item not found");

            if (!workItem.RequiresApproval)
                return SubmitForApprovalResult.Failed("This work item does not require approval");

            if (workItem.Status != WorkItemStatus.InProgress)
                return SubmitForApprovalResult.Failed($"Cannot submit for approval from status: {workItem.Status}");

            // Use direct update to avoid concurrency issues
            var rowsAffected = await _repository.UpdateStatusDirectlyAsync(
                request.WorkItemId,
                WorkItemStatus.PendingApproval,
                request.SubmittedByUserId,
                cancellationToken);

            if (rowsAffected == 0)
                return SubmitForApprovalResult.Failed("Work item not found or status has changed");

            // Add history entry
            var historyAction = "Submitted for approval" + (request.Notes != null ? $": {request.Notes}" : "");
            await _repository.AddHistoryEntryAsync(
                request.WorkItemId,
                historyAction,
                request.SubmittedByUserId,
                WorkItemStatus.PendingApproval.ToString(),
                cancellationToken);

            _logger.LogInformation("Work item {WorkItemId} submitted for approval by {UserId}",
                request.WorkItemId, request.SubmittedByUserId);

            return SubmitForApprovalResult.Successful();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting work item {WorkItemId} for approval", request.WorkItemId);
            return SubmitForApprovalResult.Failed(ex.Message);
        }
    }
}

public class ApproveWorkItemCommandHandler : IRequestHandler<ApproveWorkItemCommand, ApproveWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<ApproveWorkItemCommandHandler> _logger;

    public ApproveWorkItemCommandHandler(
        IWorkItemRepository repository,
        ILogger<ApproveWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<ApproveWorkItemResult> Handle(ApproveWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate work item exists and is in correct status
            var workItem = await _repository.GetByIdForUpdateAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return ApproveWorkItemResult.Failed("Work item not found");

            if (workItem.Status != WorkItemStatus.PendingApproval)
                return ApproveWorkItemResult.Failed($"Cannot approve from status: {workItem.Status}");

            // Check if approver has sufficient role for risk level
            if (workItem.RiskLevel is RiskLevel.High or RiskLevel.Critical)
            {
                if (!request.ApproverRole.Contains("ComplianceManager", StringComparison.OrdinalIgnoreCase) &&
                    !request.ApproverRole.Contains("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    return ApproveWorkItemResult.Failed("High/Critical risk items require Compliance Manager approval");
                }
            }

            // Use direct update to avoid concurrency issues
            var rowsAffected = await _repository.ApproveDirectlyAsync(
                request.WorkItemId,
                request.ApproverUserId,
                request.ApproverUserName,
                cancellationToken);

            if (rowsAffected == 0)
                return ApproveWorkItemResult.Failed("Work item not found or status has changed");

            // Add history entry
            var historyAction = $"Approved by {request.ApproverUserName}" + (request.Notes != null ? $": {request.Notes}" : "");
            await _repository.AddHistoryEntryAsync(
                request.WorkItemId,
                historyAction,
                request.ApproverUserName,
                WorkItemStatus.Approved.ToString(),
                cancellationToken);

            _logger.LogInformation("Work item {WorkItemId} approved by {ApproverName}",
                request.WorkItemId, request.ApproverUserName);

            return ApproveWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving work item {WorkItemId}", request.WorkItemId);
            return ApproveWorkItemResult.Failed(ex.Message);
        }
    }
}

public class CompleteWorkItemCommandHandler : IRequestHandler<CompleteWorkItemCommand, CompleteWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<CompleteWorkItemCommandHandler> _logger;

    public CompleteWorkItemCommandHandler(
        IWorkItemRepository repository,
        IProjectionRepository projectionRepository,
        ILogger<CompleteWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<CompleteWorkItemResult> Handle(CompleteWorkItemCommand request, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        int attempt = 0;
        Guid? applicationId = null;
        
        while (attempt < maxRetries)
        {
            try
            {
                attempt++;
                _logger.LogDebug("Completing work item {WorkItemId}, attempt {Attempt}", request.WorkItemId, attempt);
                
                // Check if work item exists and validate status
                var workItem = await _repository.GetByIdForUpdateAsync(request.WorkItemId, cancellationToken);
                if (workItem == null)
                    return CompleteWorkItemResult.Failed("Work item not found");

                if (workItem.IsCompleted)
                    return CompleteWorkItemResult.Failed("Work item is already completed");

                if (workItem.RequiresApproval && workItem.Status != WorkItemStatus.Approved)
                    return CompleteWorkItemResult.Failed("Work item must be approved before completion");

                applicationId = workItem.ApplicationId;

                // Use ExecuteUpdate to complete the work item directly in the database
                // This bypasses change tracking and avoids concurrency issues with owned collections
                var rowsAffected = await _repository.CompleteDirectlyAsync(
                    request.WorkItemId,
                    request.CompletedByUserId,
                    cancellationToken);
                
                if (rowsAffected == 0)
                {
                    // Entity might have been deleted or status changed
                    return CompleteWorkItemResult.Failed("Work item not found or has already been completed");
                }
                
                // Add history entry separately using raw SQL to avoid owned collection issues
                var historyAction = "Completed" + (request.Notes != null ? $": {request.Notes}" : "");
                await _repository.AddHistoryEntryAsync(
                    request.WorkItemId,
                    historyAction,
                    request.CompletedByUserId,
                    WorkItemStatus.Completed.ToString(),
                    cancellationToken);
                
                // Sync status to case projection: Completed -> "COMPLETE" (frontend expected value)
                if (applicationId.HasValue)
                {
                    try
                    {
                        await _projectionRepository.UpdateCaseStatusAsync(
                            applicationId.Value,
                            "COMPLETE",
                            cancellationToken);
                        _logger.LogInformation("Synced status to case projection: CaseId={CaseId}, Status=COMPLETE", applicationId.Value);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to sync status to case projection for CaseId={CaseId}", applicationId.Value);
                    }
                }
                
                _logger.LogInformation(
                    "Work item {WorkItemId} completed by {UserId} on attempt {Attempt}",
                    request.WorkItemId,
                    request.CompletedByUserId,
                    attempt);
                
                return CompleteWorkItemResult.Successful();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("completed") || ex.Message.Contains("approved"))
            {
                _logger.LogWarning("Cannot complete work item {WorkItemId}: {Message}", request.WorkItemId, ex.Message);
                return CompleteWorkItemResult.Failed(ex.Message);
            }
            catch (Exception ex) when ((ex.Message.Contains("concurrency") || ex.Message.Contains("expected to affect")) && attempt < maxRetries)
            {
                _logger.LogWarning(ex, "Concurrency conflict completing work item {WorkItemId} on attempt {Attempt}. Retrying...", 
                    request.WorkItemId, attempt);
                
                // Wait a bit before retry to allow any concurrent operations to complete
                await Task.Delay(100 * attempt, cancellationToken);
                
                // Continue to retry
                continue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing work item {WorkItemId} on attempt {Attempt}", request.WorkItemId, attempt);
                return CompleteWorkItemResult.Failed(ex.Message);
            }
        }
        
        return CompleteWorkItemResult.Failed("Failed to complete work item after multiple retries due to concurrency conflicts");
    }
}

public class DeclineWorkItemCommandHandler : IRequestHandler<DeclineWorkItemCommand, DeclineWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<DeclineWorkItemCommandHandler> _logger;

    public DeclineWorkItemCommandHandler(
        IWorkItemRepository repository,
        IProjectionRepository projectionRepository,
        ILogger<DeclineWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<DeclineWorkItemResult> Handle(DeclineWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Use direct database update to avoid concurrency issues with EF Core change tracking
            var (rowsAffected, applicationId) = await _repository.DeclineDirectlyAsync(
                request.WorkItemId,
                request.DeclinedByUserId,
                request.Reason,
                cancellationToken);
            
            if (rowsAffected == 0)
                return DeclineWorkItemResult.Failed("Work item not found or already in a terminal state");
            
            // Sync status to case projection: Declined -> "DECLINED" (frontend expected value)
            if (applicationId.HasValue)
            {
                try
                {
                    await _projectionRepository.UpdateCaseStatusAsync(
                        applicationId.Value,
                        "DECLINED",
                        cancellationToken);
                    _logger.LogInformation("Synced status to case projection: CaseId={CaseId}, Status=DECLINED", applicationId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to sync status to case projection for CaseId={CaseId}", applicationId);
                }
            }
            
            return DeclineWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            return DeclineWorkItemResult.Failed(ex.Message);
        }
    }
}

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, AddCommentResult>
{
    private readonly IWorkItemRepository _repository;

    public AddCommentCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<AddCommentResult> Handle(AddCommentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // First check if work item exists
            var workItem = await _repository.GetByIdForUpdateAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return AddCommentResult.Failed("Work item not found");

            // Use direct SQL insert to avoid EF Core owned collection tracking issues
            var commentId = await _repository.AddCommentDirectlyAsync(
                request.WorkItemId, 
                request.Text, 
                request.AuthorId, 
                request.AuthorName, 
                cancellationToken);
            
            return AddCommentResult.Successful(commentId);
        }
        catch (Exception ex)
        {
            return AddCommentResult.Failed(ex.Message);
        }
    }
}

public class MarkForRefreshCommandHandler : IRequestHandler<MarkForRefreshCommand, MarkForRefreshResult>
{
    private readonly IWorkItemRepository _repository;

    public MarkForRefreshCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<MarkForRefreshResult> Handle(MarkForRefreshCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Use direct database update to avoid concurrency issues with EF Core change tracking
            var rowsAffected = await _repository.MarkForRefreshDirectlyAsync(
                request.WorkItemId, 
                request.MarkedByUserId, 
                cancellationToken);
            
            if (rowsAffected == 0)
                return MarkForRefreshResult.Failed("Work item not found");

            return MarkForRefreshResult.Successful();
        }
        catch (Exception ex)
        {
            return MarkForRefreshResult.Failed(ex.Message);
        }
    }
}

public class UpdateStepReviewStatusCommandHandler : IRequestHandler<UpdateStepReviewStatusCommand, UpdateStepReviewStatusResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<UpdateStepReviewStatusCommandHandler> _logger;

    public UpdateStepReviewStatusCommandHandler(
        IWorkItemRepository repository,
        ILogger<UpdateStepReviewStatusCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<UpdateStepReviewStatusResult> Handle(UpdateStepReviewStatusCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Verify work item exists
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
            {
                return UpdateStepReviewStatusResult.Failed("Work item not found");
            }

            // Validate field before attempting upsert
            // Parse string field to strongly-typed enum
            var field = ReviewFieldExtensions.ParseReviewField(request.Field);
            if (field == null)
            {
                return UpdateStepReviewStatusResult.Failed($"Invalid field: {request.Field}. Must be 'completed', 'verified', or 'approved'");
            }

            // RACE CONDITION FIX: Use atomic upsert instead of read-then-write pattern
            // This prevents the scenario where two concurrent requests both see null and both try to insert
            // PostgreSQL ON CONFLICT ensures only one row exists per (work_item_id, step_id)
            var reviewId = await _repository.UpsertStepReviewAsync(
                request.WorkItemId,
                request.StepId,
                field.Value,
                request.Value,
                request.UpdatedByUserId,
                request.Notes,
                cancellationToken);

            _logger.LogInformation(
                "Step review status updated atomically: WorkItemId={WorkItemId}, StepId={StepId}, Field={Field}, Value={Value}, UpdatedBy={UpdatedBy}, ReviewId={ReviewId}",
                request.WorkItemId, request.StepId, request.Field, request.Value, request.UpdatedByUserId, reviewId);

            return UpdateStepReviewStatusResult.Successful();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating step review status for WorkItemId={WorkItemId}, StepId={StepId}", request.WorkItemId, request.StepId);
            return UpdateStepReviewStatusResult.Failed(ex.Message);
        }
    }
}

public class DeleteWorkItemCommandHandler : IRequestHandler<DeleteWorkItemCommand, DeleteWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<DeleteWorkItemCommandHandler> _logger;

    public DeleteWorkItemCommandHandler(
        IWorkItemRepository repository,
        ILogger<DeleteWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<DeleteWorkItemResult> Handle(DeleteWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
            {
                _logger.LogWarning("Work item {WorkItemId} not found for deletion", request.WorkItemId);
                return DeleteWorkItemResult.Successful(); // Already deleted, consider success
            }

            await _repository.DeleteAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted work item {WorkItemId} (saga compensation)", request.WorkItemId);
            return DeleteWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting work item {WorkItemId}", request.WorkItemId);
            return DeleteWorkItemResult.Failed(ex.Message);
        }
    }
}
