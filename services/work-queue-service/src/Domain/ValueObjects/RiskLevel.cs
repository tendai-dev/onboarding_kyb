namespace WorkQueueService.Domain.ValueObjects;

public enum RiskLevel
{
    Unknown = 0,  // Default until manually assessed by reviewer
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}
