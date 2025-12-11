using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
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

            return CreateWorkItemResult.Successful(workItem.Id);
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
    private readonly ILogger<AssignWorkItemCommandHandler> _logger;

    public AssignWorkItemCommandHandler(IWorkItemRepository repository, ILogger<AssignWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<AssignWorkItemResult> Handle(AssignWorkItemCommand request, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        int attempt = 0;
        
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
                    request.AssignedByUserId,
                    currentStatus,
                    cancellationToken);
                
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

    public UnassignWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<UnassignWorkItemResult> Handle(UnassignWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return UnassignWorkItemResult.Failed("Work item not found");

            workItem.Unassign(request.UnassignedByUserId);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
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
    private readonly ILogger<StartReviewCommandHandler> _logger;

    public StartReviewCommandHandler(
        IWorkItemRepository repository,
        ILogger<StartReviewCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<StartReviewResult> Handle(StartReviewCommand request, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        int attempt = 0;
        
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

    public SubmitForApprovalCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<SubmitForApprovalResult> Handle(SubmitForApprovalCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return SubmitForApprovalResult.Failed("Work item not found");

            workItem.SubmitForApproval(request.SubmittedByUserId, request.Notes);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return SubmitForApprovalResult.Successful();
        }
        catch (Exception ex)
        {
            return SubmitForApprovalResult.Failed(ex.Message);
        }
    }
}

public class ApproveWorkItemCommandHandler : IRequestHandler<ApproveWorkItemCommand, ApproveWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public ApproveWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApproveWorkItemResult> Handle(ApproveWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return ApproveWorkItemResult.Failed("Work item not found");

            workItem.Approve(request.ApproverUserId, request.ApproverUserName, request.ApproverRole, request.Notes);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return ApproveWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            return ApproveWorkItemResult.Failed(ex.Message);
        }
    }
}

public class CompleteWorkItemCommandHandler : IRequestHandler<CompleteWorkItemCommand, CompleteWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public CompleteWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<CompleteWorkItemResult> Handle(CompleteWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return CompleteWorkItemResult.Failed("Work item not found");

            workItem.Complete(request.CompletedByUserId, request.Notes);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return CompleteWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            return CompleteWorkItemResult.Failed(ex.Message);
        }
    }
}

public class DeclineWorkItemCommandHandler : IRequestHandler<DeclineWorkItemCommand, DeclineWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public DeclineWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<DeclineWorkItemResult> Handle(DeclineWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return DeclineWorkItemResult.Failed("Work item not found");

            workItem.Decline(request.DeclinedByUserId, request.Reason);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
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
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return AddCommentResult.Failed("Work item not found");

            workItem.AddComment(request.Text, request.AuthorId, request.AuthorName);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            
            var lastComment = workItem.Comments.OrderByDescending(c => c.CreatedAt).FirstOrDefault();
            var commentId = lastComment?.Id ?? Guid.NewGuid();
            
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
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return MarkForRefreshResult.Failed("Work item not found");

            workItem.MarkForRefresh(request.MarkedByUserId);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
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

            // Find existing review or create new
            var review = await _repository.GetStepReviewAsync(request.WorkItemId, request.StepId, cancellationToken);

            var now = DateTime.UtcNow;

            if (review == null)
            {
                review = new WorkItemStepReview
                {
                    Id = Guid.NewGuid(),
                    WorkItemId = request.WorkItemId,
                    StepId = request.StepId,
                    CreatedAt = now,
                };
            }

            // Update the appropriate field
            switch (request.Field.ToLowerInvariant())
            {
                case "completed":
                    review.Completed = request.Value;
                    review.CompletedAt = request.Value ? now : null;
                    review.CompletedBy = request.Value ? request.UpdatedByUserId : null;
                    break;
                case "verified":
                    review.Verified = request.Value;
                    review.VerifiedAt = request.Value ? now : null;
                    review.VerifiedBy = request.Value ? request.UpdatedByUserId : null;
                    break;
                case "approved":
                    review.Approved = request.Value;
                    review.ApprovedAt = request.Value ? now : null;
                    review.ApprovedBy = request.Value ? request.UpdatedByUserId : null;
                    break;
                default:
                    return UpdateStepReviewStatusResult.Failed($"Invalid field: {request.Field}. Must be 'completed', 'verified', or 'approved'");
            }

            // Update notes if provided
            if (request.Notes != null)
            {
                review.Notes = request.Notes;
            }

            review.UpdatedAt = now;
            await _repository.AddOrUpdateStepReviewAsync(review, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Step review status updated: WorkItemId={WorkItemId}, StepId={StepId}, Field={Field}, Value={Value}, UpdatedBy={UpdatedBy}",
                request.WorkItemId, request.StepId, request.Field, request.Value, request.UpdatedByUserId);

            return UpdateStepReviewStatusResult.Successful();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating step review status for WorkItemId={WorkItemId}, StepId={StepId}", request.WorkItemId, request.StepId);
            return UpdateStepReviewStatusResult.Failed(ex.Message);
        }
    }
}

