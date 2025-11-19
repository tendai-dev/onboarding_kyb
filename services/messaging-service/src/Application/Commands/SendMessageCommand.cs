using MediatR;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Commands;

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

