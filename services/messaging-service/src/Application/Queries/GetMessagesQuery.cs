using MediatR;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Queries;

public record GetThreadByApplicationIdQuery(
    Guid ApplicationId
) : IRequest<MessageThreadDto?>;

public record GetMessagesQuery(
    Guid ThreadId,
    int Page = 1,
    int PageSize = 50
) : IRequest<PagedResult<MessageDto>>;

public record GetUnreadCountQuery(
    Guid UserId,
    UserRole UserRole
) : IRequest<int>;

public record GetMyThreadsQuery(
    Guid UserId,
    UserRole UserRole,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<MessageThreadDto>>;

public record GetAllThreadsQuery(
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<MessageThreadDto>>;

// DTOs
public record MessageDto
{
    public Guid Id { get; init; }
    public Guid ThreadId { get; init; }
    public Guid SenderId { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string SenderRole { get; init; } = string.Empty;
    public Guid? ReceiverId { get; init; }
    public string? ReceiverName { get; init; }
    public string Content { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime SentAt { get; init; }
    public DateTime? ReadAt { get; init; }
    public bool IsRead { get; init; }
    public Guid? ReplyToMessageId { get; init; }
    public bool IsStarred { get; init; }
    public List<MessageAttachmentDto>? Attachments { get; init; }
}

public record MessageAttachmentDto
{
    public Guid Id { get; init; }
    public Guid MessageId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public string StorageKey { get; init; } = string.Empty;
    public string StorageUrl { get; init; } = string.Empty;
    public Guid? DocumentId { get; init; }
    public string? Description { get; init; }
    public DateTime UploadedAt { get; init; }
}

public record MessageThreadDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string ApplicationReference { get; init; } = string.Empty;
    public Guid ApplicantId { get; init; }
    public string ApplicantName { get; init; } = string.Empty;
    public Guid? AssignedAdminId { get; init; }
    public string? AssignedAdminName { get; init; }
    public bool IsActive { get; init; }
    public bool IsArchived { get; init; }
    public bool IsStarred { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime LastMessageAt { get; init; }
    public int MessageCount { get; init; }
    public int UnreadCount { get; init; }
    public MessageDto? LastMessage { get; init; }
}

public record PagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}

