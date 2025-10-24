namespace ChecklistService.Domain.ValueObjects;

public record CheckResult(
    bool IsValid,
    string Message,
    decimal Score = 0
);