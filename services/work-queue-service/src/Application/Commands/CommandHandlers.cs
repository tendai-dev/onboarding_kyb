using MediatR;
using Microsoft.Extensions.Logging;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Domain.Aggregates;

namespace WorkQueueService.Application.Commands;

/// <summary>
/// Handler for AssignWorkItemCommand
/// </summary>
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
        int retryCount = 0;

        while (retryCount < maxRetries)
        {
            try
            {
                var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
                if (workItem == null)
                    return AssignWorkItemResult.Failed("Work item not found");

                workItem.AssignTo(request.AssignedToUserId, request.AssignedToUserName, request.AssignedByUserId);
                // Since entity is tracked, we don't need UpdateAsync - EF Core detects changes automatically
                // But we'll call it for consistency with the interface
                await _repository.UpdateAsync(workItem, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
                return AssignWorkItemResult.Successful();
            }
            catch (Exception ex)
            {
                // Log the actual exception for debugging
                _logger.LogError(ex, "Error assigning work item {WorkItemId} to user {UserId}. Attempt {Attempt}/{MaxRetries}", 
                    request.WorkItemId, request.AssignedToUserId, retryCount + 1, maxRetries);
                
                // Check if it's a concurrency exception by checking the exception message and type
                // Also check inner exception for nested concurrency exceptions
                var exceptionMessage = ex.Message + (ex.InnerException?.Message ?? "");
                var exceptionTypeName = ex.GetType().Name + (ex.InnerException?.GetType().Name ?? "");
                
                bool isConcurrencyException = exceptionMessage.Contains("optimistic concurrency", StringComparison.OrdinalIgnoreCase) || 
                                             exceptionMessage.Contains("expected to affect 1 row", StringComparison.OrdinalIgnoreCase) ||
                                             exceptionMessage.Contains("The database operation was expected to affect 1 row(s)", StringComparison.OrdinalIgnoreCase) ||
                                             exceptionMessage.Contains("rowversion", StringComparison.OrdinalIgnoreCase) ||
                                             exceptionTypeName.Contains("Concurrency", StringComparison.OrdinalIgnoreCase) ||
                                             exceptionTypeName.Contains("DbUpdateConcurrency", StringComparison.OrdinalIgnoreCase);
                
                if (isConcurrencyException)
                {
                    retryCount++;
                    _logger.LogWarning("Concurrency exception detected. Retrying ({RetryCount}/{MaxRetries})", retryCount, maxRetries);
                    
                    if (retryCount >= maxRetries)
                    {
                        _logger.LogError("Failed to assign work item after {MaxRetries} attempts due to concurrency conflicts", maxRetries);
                        return AssignWorkItemResult.Failed($"Failed to assign work item after {maxRetries} attempts. The work item may have been modified by another user. Please refresh and try again.");
                    }
                    // Clear the context and reload the entity fresh from the database
                    await _repository.ClearTrackingAsync(request.WorkItemId, cancellationToken);
                    // Wait a bit before retrying
                    await Task.Delay(100 * retryCount, cancellationToken);
                    // Continue to retry (will reload entity in next iteration)
                    continue;
                }
                // For non-concurrency exceptions, return immediately with the actual error
                _logger.LogError("Non-concurrency exception: {ExceptionType}: {Message}", ex.GetType().Name, ex.Message);
                // Return detailed error for debugging
                var errorDetails = $"Exception: {ex.GetType().Name} - {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorDetails += $" | Inner: {ex.InnerException.GetType().Name} - {ex.InnerException.Message}";
                }
                if (ex.StackTrace != null)
                {
                    errorDetails += $" | StackTrace: {ex.StackTrace.Split('\n').FirstOrDefault()}";
                }
                return AssignWorkItemResult.Failed(errorDetails);
            }
        }

        return AssignWorkItemResult.Failed("Failed to assign work item");
    }
}

/// <summary>
/// Handler for UnassignWorkItemCommand
/// </summary>
public class UnassignWorkItemCommandHandler : IRequestHandler<UnassignWorkItemCommand, UnassignWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public UnassignWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<UnassignWorkItemResult> Handle(UnassignWorkItemCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return UnassignWorkItemResult.Failed("Work item not found");

        try
        {
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

/// <summary>
/// Handler for StartReviewCommand
/// </summary>
public class StartReviewCommandHandler : IRequestHandler<StartReviewCommand, StartReviewResult>
{
    private readonly IWorkItemRepository _repository;

    public StartReviewCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<StartReviewResult> Handle(StartReviewCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return StartReviewResult.Failed("Work item not found");

        try
        {
            workItem.StartReview(request.ReviewedByUserId);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return StartReviewResult.Successful();
        }
        catch (Exception ex)
        {
            return StartReviewResult.Failed(ex.Message);
        }
    }
}

/// <summary>
/// Handler for SubmitForApprovalCommand
/// </summary>
public class SubmitForApprovalCommandHandler : IRequestHandler<SubmitForApprovalCommand, SubmitForApprovalResult>
{
    private readonly IWorkItemRepository _repository;

    public SubmitForApprovalCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<SubmitForApprovalResult> Handle(SubmitForApprovalCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return SubmitForApprovalResult.Failed("Work item not found");

        try
        {
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

/// <summary>
/// Handler for ApproveWorkItemCommand
/// </summary>
public class ApproveWorkItemCommandHandler : IRequestHandler<ApproveWorkItemCommand, ApproveWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public ApproveWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApproveWorkItemResult> Handle(ApproveWorkItemCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return ApproveWorkItemResult.Failed("Work item not found");

        try
        {
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

/// <summary>
/// Handler for CompleteWorkItemCommand
/// </summary>
public class CompleteWorkItemCommandHandler : IRequestHandler<CompleteWorkItemCommand, CompleteWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public CompleteWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<CompleteWorkItemResult> Handle(CompleteWorkItemCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return CompleteWorkItemResult.Failed("Work item not found");

        try
        {
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

/// <summary>
/// Handler for DeclineWorkItemCommand
/// </summary>
public class DeclineWorkItemCommandHandler : IRequestHandler<DeclineWorkItemCommand, DeclineWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public DeclineWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<DeclineWorkItemResult> Handle(DeclineWorkItemCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return DeclineWorkItemResult.Failed("Work item not found");

        try
        {
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

/// <summary>
/// Handler for AddCommentCommand
/// </summary>
public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, AddCommentResult>
{
    private readonly IWorkItemRepository _repository;

    public AddCommentCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<AddCommentResult> Handle(AddCommentCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return AddCommentResult.Failed("Work item not found");

        try
        {
            workItem.AddComment(request.Text, request.AuthorId, request.AuthorName);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            
            // Get the last added comment to return its ID
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

