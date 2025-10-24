namespace MessagingService.Domain.ValueObjects;

public record MessageThreadDto(
    Guid Id,
    string Subject,
    Guid SenderId,
    string SenderName,
    Guid ReceiverId,
    string ReceiverName,
    DateTime LastMessageAt,
    int UnreadCount
);
