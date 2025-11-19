using MediatR;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;

namespace OnboardingApi.Application.Messaging.Commands;

public record SendMessageCommand(
    Guid ApplicationId,
    Guid SenderId,
    string SenderName,
    UserRole SenderRole,
    string Content,
    Guid? ReceiverId = null,
    Guid? ReplyToMessageId = null,
    IEnumerable<AttachmentInfo>? Attachments = null
) : IRequest<SendMessageResult>;

public record AttachmentInfo(
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string StorageKey,
    string StorageUrl,
    Guid? DocumentId = null,
    string? Description = null
);

public record SendMessageResult
{
    public bool Success { get; init; }
    public Guid? MessageId { get; init; }
    public Guid? ThreadId { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static SendMessageResult Successful(Guid messageId, Guid threadId) => new()
    {
        Success = true,
        MessageId = messageId,
        ThreadId = threadId
    };
    
    public static SendMessageResult Failed(string error) => new()
    {
        Success = false,
        ErrorMessage = error
    };
}

public record MarkMessageAsReadCommand(
    Guid MessageId,
    Guid UserId
) : IRequest<MarkMessageAsReadResult>;

public record MarkMessageAsReadResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static MarkMessageAsReadResult Successful() => new() { Success = true };
    public static MarkMessageAsReadResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record DeleteMessageCommand(
    Guid MessageId,
    Guid UserId
) : IRequest<DeleteMessageResult>;

public record DeleteMessageResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static DeleteMessageResult Successful() => new() { Success = true };
    public static DeleteMessageResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record StarMessageCommand(
    Guid MessageId,
    Guid UserId
) : IRequest<StarMessageResult>;

public record StarMessageResult
{
    public bool Success { get; init; }
    public bool IsStarred { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static StarMessageResult Successful(bool isStarred) => new() { Success = true, IsStarred = isStarred };
    public static StarMessageResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record ArchiveThreadCommand(
    Guid ThreadId,
    Guid UserId,
    bool Archive
) : IRequest<ArchiveThreadResult>;

public record ArchiveThreadResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static ArchiveThreadResult Successful() => new() { Success = true };
    public static ArchiveThreadResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record StarThreadCommand(
    Guid ThreadId,
    Guid UserId
) : IRequest<StarThreadResult>;

public record StarThreadResult
{
    public bool Success { get; init; }
    public bool IsStarred { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static StarThreadResult Successful(bool isStarred) => new() { Success = true, IsStarred = isStarred };
    public static StarThreadResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public record ForwardMessageCommand(
    Guid MessageId,
    Guid UserId,
    Guid ToApplicationId,
    Guid? ToReceiverId,
    string? AdditionalContent
) : IRequest<ForwardMessageResult>;

public record ForwardMessageResult
{
    public bool Success { get; init; }
    public Guid? NewMessageId { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static ForwardMessageResult Successful(Guid newMessageId) => new() { Success = true, NewMessageId = newMessageId };
    public static ForwardMessageResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

