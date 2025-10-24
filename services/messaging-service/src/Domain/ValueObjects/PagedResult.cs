namespace MessagingService.Domain.ValueObjects;

public record PagedResult<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);
