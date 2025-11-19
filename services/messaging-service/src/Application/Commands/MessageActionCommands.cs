using MediatR;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Commands;

/// <summary>
/// Star or unstar a message
/// </summary>
public record StarMessageCommand(
    Guid MessageId,
    Guid UserId
) : IRequest<StarMessageResult>;

public record StarMessageResult
{
    public bool Success { get; init; }
    public bool IsStarred { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static StarMessageResult Successful(bool isStarred) => new() 
    { 
        Success = true, 
        IsStarred = isStarred 
    };
    
    public static StarMessageResult Failed(string error) => new() 
    { 
        Success = false, 
        ErrorMessage = error 
    };
}

/// <summary>
/// Archive or unarchive a thread
/// </summary>
public record ArchiveThreadCommand(
    Guid ThreadId,
    Guid UserId,
    bool Archive
) : IRequest<ArchiveThreadResult>;

public record ArchiveThreadResult
{
    public bool Success { get; init; }
    public bool IsArchived { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static ArchiveThreadResult Successful(bool isArchived) => new() 
    { 
        Success = true, 
        IsArchived = isArchived 
    };
    
    public static ArchiveThreadResult Failed(string error) => new() 
    { 
        Success = false, 
        ErrorMessage = error 
    };
}

/// <summary>
/// Star or unstar a thread
/// </summary>
public record StarThreadCommand(
    Guid ThreadId,
    Guid UserId
) : IRequest<StarThreadResult>;

public record StarThreadResult
{
    public bool Success { get; init; }
    public bool IsStarred { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static StarThreadResult Successful(bool isStarred) => new() 
    { 
        Success = true, 
        IsStarred = isStarred 
    };
    
    public static StarThreadResult Failed(string error) => new() 
    { 
        Success = false, 
        ErrorMessage = error 
    };
}

/// <summary>
/// Forward a message to another thread or user
/// </summary>
public record ForwardMessageCommand(
    Guid MessageId,
    Guid FromUserId,
    Guid ToApplicationId,
    Guid? ToReceiverId = null,
    string? AdditionalContent = null
) : IRequest<ForwardMessageResult>;

public record ForwardMessageResult
{
    public bool Success { get; init; }
    public Guid? NewMessageId { get; init; }
    public Guid? NewThreadId { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static ForwardMessageResult Successful(Guid messageId, Guid threadId) => new() 
    { 
        Success = true, 
        NewMessageId = messageId,
        NewThreadId = threadId
    };
    
    public static ForwardMessageResult Failed(string error) => new() 
    { 
        Success = false, 
        ErrorMessage = error 
    };
}

