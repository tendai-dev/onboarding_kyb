namespace MessagingService.Domain.ValueObjects;

public record SendMessageResult(
    bool Success,
    string? ErrorMessage = null,
    Guid? MessageId = null
);
