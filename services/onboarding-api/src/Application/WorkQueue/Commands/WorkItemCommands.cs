using MediatR;
using OnboardingApi.Domain.WorkQueue.ValueObjects;

namespace OnboardingApi.Application.WorkQueue.Commands;

public record CreateWorkItemCommand(
    Guid ApplicationId,
    string ApplicantName,
    string EntityType,
    string Country,
    string RiskLevel, // String to parse to enum
    string CreatedBy,
    int SlaDays = 5
) : IRequest<CreateWorkItemResult>;

public record CreateWorkItemResult
{
    public bool Success { get; init; }
    public Guid? WorkItemId { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static CreateWorkItemResult Successful(Guid workItemId) => new() { Success = true, WorkItemId = workItemId };
    public static CreateWorkItemResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record AssignWorkItemCommand(
    Guid WorkItemId,
    Guid AssignedToUserId,
    string AssignedToUserName,
    string AssignedByUserId
) : IRequest<AssignWorkItemResult>;

public record AssignWorkItemResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static AssignWorkItemResult Successful() => new() { Success = true };
    public static AssignWorkItemResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record UnassignWorkItemCommand(
    Guid WorkItemId,
    string UnassignedByUserId
) : IRequest<UnassignWorkItemResult>;

public record UnassignWorkItemResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static UnassignWorkItemResult Successful() => new() { Success = true };
    public static UnassignWorkItemResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record StartReviewCommand(
    Guid WorkItemId,
    string ReviewedByUserId
) : IRequest<StartReviewResult>;

public record StartReviewResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static StartReviewResult Successful() => new() { Success = true };
    public static StartReviewResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record SubmitForApprovalCommand(
    Guid WorkItemId,
    string SubmittedByUserId,
    string? Notes
) : IRequest<SubmitForApprovalResult>;

public record SubmitForApprovalResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static SubmitForApprovalResult Successful() => new() { Success = true };
    public static SubmitForApprovalResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record ApproveWorkItemCommand(
    Guid WorkItemId,
    Guid ApproverUserId,
    string ApproverUserName,
    string ApproverRole,
    string? Notes
) : IRequest<ApproveWorkItemResult>;

public record ApproveWorkItemResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static ApproveWorkItemResult Successful() => new() { Success = true };
    public static ApproveWorkItemResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record CompleteWorkItemCommand(
    Guid WorkItemId,
    string CompletedByUserId,
    string? Notes
) : IRequest<CompleteWorkItemResult>;

public record CompleteWorkItemResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static CompleteWorkItemResult Successful() => new() { Success = true };
    public static CompleteWorkItemResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record DeclineWorkItemCommand(
    Guid WorkItemId,
    string DeclinedByUserId,
    string Reason
) : IRequest<DeclineWorkItemResult>;

public record DeclineWorkItemResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static DeclineWorkItemResult Successful() => new() { Success = true };
    public static DeclineWorkItemResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record AddCommentCommand(
    Guid WorkItemId,
    string Text,
    string AuthorId,
    string AuthorName
) : IRequest<AddCommentResult>;

public record AddCommentResult
{
    public bool Success { get; init; }
    public Guid? CommentId { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static AddCommentResult Successful(Guid commentId) => new() { Success = true, CommentId = commentId };
    public static AddCommentResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record MarkForRefreshCommand(
    Guid WorkItemId,
    string MarkedByUserId
) : IRequest<MarkForRefreshResult>;

public record MarkForRefreshResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static MarkForRefreshResult Successful() => new() { Success = true };
    public static MarkForRefreshResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

