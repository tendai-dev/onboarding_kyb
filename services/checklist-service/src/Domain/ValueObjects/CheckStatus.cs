namespace ChecklistService.Domain.ValueObjects;

public enum CheckStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Skipped = 4,
    Failed = 5
}
