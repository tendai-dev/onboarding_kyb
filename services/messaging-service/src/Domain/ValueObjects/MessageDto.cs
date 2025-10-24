namespace MessagingService.Domain.ValueObjects;

public record MessageDto(
    Guid Id,
    string Content,
    Guid SenderId,
    string SenderName,
    DateTime SentAt,
    bool IsRead
);
