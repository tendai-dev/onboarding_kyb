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
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return AssignWorkItemResult.Failed("Work item not found");

            workItem.AssignTo(request.AssignedToUserId, request.AssignedToUserName, request.AssignedByUserId);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return AssignWorkItemResult.Successful();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning work item");
            return AssignWorkItemResult.Failed(ex.Message);
        }
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

    public StartReviewCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<StartReviewResult> Handle(StartReviewCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
            if (workItem == null)
                return StartReviewResult.Failed("Work item not found");

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

