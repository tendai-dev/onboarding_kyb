namespace WorkQueueService.Domain.ValueObjects;

public enum WorkItemStatus
{
    New = 1,
    InProgress = 2,
    UnderReview = 3,
    Completed = 4,
    Declined = 5,
    DueForRefresh = 6
}
