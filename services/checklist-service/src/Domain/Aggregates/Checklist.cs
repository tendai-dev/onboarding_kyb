using ChecklistService.Domain.Events;
using ChecklistService.Domain.ValueObjects;
using MediatR;

namespace ChecklistService.Domain.Aggregates;

public class Checklist
{
    private readonly List<IDomainEvent> _domainEvents = new();
    private readonly List<ChecklistItem> _items = new();

    public ChecklistId Id { get; private set; }
    public string CaseId { get; private set; }
    public ChecklistType Type { get; private set; }
    public ChecklistStatus Status { get; private set; }
    public string PartnerId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public IReadOnlyList<ChecklistItem> Items => _items.AsReadOnly();
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    private Checklist() { } // EF Core

    public static Checklist Create(
        string caseId,
        ChecklistType type,
        string partnerId,
        List<ChecklistItemTemplate> templates)
    {
        var checklist = new Checklist
        {
            Id = ChecklistId.New(),
            CaseId = caseId,
            Type = type,
            Status = ChecklistStatus.InProgress,
            PartnerId = partnerId,
            CreatedAt = DateTime.UtcNow
        };

        // Create items from templates
        foreach (var template in templates)
        {
            var item = ChecklistItem.Create(
                template.Code,
                template.Name,
                template.Description,
                template.Category,
                template.IsRequired,
                template.Order);
            
            checklist._items.Add(item);
        }

        checklist.AddDomainEvent(new ChecklistCreatedEvent(
            checklist.Id.Value,
            Guid.Parse(checklist.CaseId),
            (ValueObjects.EntityType)checklist.Type,
            ValueObjects.RiskTier.Medium, // Default risk tier
            checklist.Items.Count,
            DateTime.UtcNow));

        return checklist;
    }

    public void CompleteItem(ChecklistItemId itemId, string completedBy, string? notes = null)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new InvalidOperationException($"Checklist item {itemId} not found");

        if (item.Status == ChecklistItemStatus.Completed)
            return; // Already completed

        item.Complete(completedBy, notes);

        AddDomainEvent(new ChecklistItemCompletedEvent(
            Id.Value,
            itemId.Value,
            item.Name,
            true, // IsValid - assuming completed items are valid
            1.0m, // Score - default score
            DateTime.UtcNow));

        // Check if all required items are completed
        CheckForCompletion();
    }

    public void SkipItem(ChecklistItemId itemId, string skippedBy, string reason)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new InvalidOperationException($"Checklist item {itemId} not found");

        if (item.IsRequired)
            throw new InvalidOperationException("Cannot skip required checklist item");

        item.Skip(skippedBy, reason);

        AddDomainEvent(new ChecklistItemSkippedEvent(
            Id.Value,
            itemId.Value,
            item.Name,
            reason,
            DateTime.UtcNow));

        CheckForCompletion();
    }

    public void ResetItem(ChecklistItemId itemId, string resetBy, string reason)
    {
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new InvalidOperationException($"Checklist item {itemId} not found");

        item.Reset(resetBy, reason);

        // If checklist was completed, mark as in progress
        if (Status == ChecklistStatus.Completed)
        {
            Status = ChecklistStatus.InProgress;
            CompletedAt = null;
        }

        AddDomainEvent(new ChecklistItemResetEvent(
            Id.Value,
            itemId.Value,
            item.Name,
            DateTime.UtcNow));
    }

    private void CheckForCompletion()
    {
        var requiredItems = _items.Where(i => i.IsRequired).ToList();
        var allRequiredCompleted = requiredItems.All(i => i.Status == ChecklistItemStatus.Completed);

        if (allRequiredCompleted && Status != ChecklistStatus.Completed)
        {
            Status = ChecklistStatus.Completed;
            CompletedAt = DateTime.UtcNow;

            AddDomainEvent(new ChecklistCompletedEvent(
                Id.Value,
                Guid.Parse(CaseId),
                CalculateTotalScore(),
                CompletedAt.Value));
        }
    }

    public double GetCompletionPercentage()
    {
        if (!_items.Any()) return 0;

        var completedCount = _items.Count(i => i.Status == ChecklistItemStatus.Completed);
        return (double)completedCount / _items.Count * 100;
    }

    public double GetRequiredCompletionPercentage()
    {
        var requiredItems = _items.Where(i => i.IsRequired).ToList();
        if (!requiredItems.Any()) return 100;

        var completedRequiredCount = requiredItems.Count(i => i.Status == ChecklistItemStatus.Completed);
        return (double)completedRequiredCount / requiredItems.Count * 100;
    }

    public decimal CalculateTotalScore()
    {
        var completedItems = _items.Where(i => i.Status == ChecklistItemStatus.Completed).ToList();
        if (completedItems.Count == 0)
            return 0;

        // Simple scoring: 1 point per completed item
        return completedItems.Count;
    }

    private void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
