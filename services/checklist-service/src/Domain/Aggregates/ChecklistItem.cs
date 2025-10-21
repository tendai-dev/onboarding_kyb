using ChecklistService.Domain.ValueObjects;

namespace ChecklistService.Domain.Aggregates;

public class ChecklistItem
{
    public ChecklistItemId Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public ChecklistItemCategory Category { get; private set; }
    public bool IsRequired { get; private set; }
    public int Order { get; private set; }
    public ChecklistItemStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? CompletedBy { get; private set; }
    public string? Notes { get; private set; }
    public string? SkipReason { get; private set; }

    private ChecklistItem() { } // EF Core

    public static ChecklistItem Create(
        string name,
        string description,
        ChecklistItemCategory category,
        bool isRequired,
        int order)
    {
        return new ChecklistItem
        {
            Id = ChecklistItemId.New(),
            Name = name,
            Description = description,
            Category = category,
            IsRequired = isRequired,
            Order = order,
            Status = ChecklistItemStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Complete(string completedBy, string? notes = null)
    {
        if (Status == ChecklistItemStatus.Completed)
            return;

        Status = ChecklistItemStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        CompletedBy = completedBy;
        Notes = notes;
        SkipReason = null; // Clear skip reason if previously skipped
    }

    public void Skip(string skippedBy, string reason)
    {
        if (IsRequired)
            throw new InvalidOperationException("Cannot skip required checklist item");

        Status = ChecklistItemStatus.Skipped;
        CompletedBy = skippedBy;
        SkipReason = reason;
        CompletedAt = DateTime.UtcNow;
    }

    public void Reset(string resetBy, string reason)
    {
        Status = ChecklistItemStatus.Pending;
        CompletedAt = null;
        CompletedBy = null;
        Notes = null;
        SkipReason = $"Reset by {resetBy}: {reason}";
    }
}
