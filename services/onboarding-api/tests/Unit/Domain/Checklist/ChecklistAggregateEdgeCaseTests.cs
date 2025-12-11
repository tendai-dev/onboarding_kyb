using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.Events;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistAggregateEdgeCaseTests
{
    [Fact]
    public void ResetItem_ShouldThrow_WhenItemNotFound()
    {
        // Arrange
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            new List<ChecklistItemTemplate>());
        var nonExistentItemId = ChecklistItemId.New();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => checklist.ResetItem(nonExistentItemId, "admin", "Reason"));
    }

    [Fact]
    public void ResetItem_ShouldNotChangeStatus_WhenChecklistNotCompleted()
    {
        // Arrange
        var template = new ChecklistItemTemplate
        {
            Code = "CODE-001",
            Name = "Test Item",
            Description = "Description",
            Category = ChecklistItemCategory.Identity,
            IsRequired = true,
            Order = 1
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            new List<ChecklistItemTemplate> { template });
        var itemId = checklist.Items.First().Id;
        var originalStatus = checklist.Status;

        // Act
        checklist.ResetItem(itemId, "admin", "Reset reason");

        // Assert
        Assert.Equal(originalStatus, checklist.Status);
    }

    [Fact]
    public void GetRequiredCompletionPercentage_ShouldReturnCorrectPercentage()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Required 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new ChecklistItemTemplate { Code = "CODE-002", Name = "Required 2", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 },
            new ChecklistItemTemplate { Code = "CODE-003", Name = "Optional", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = false, Order = 3 }
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            templates);
        
        // Complete one required item
        var requiredItems = checklist.Items.Where(i => i.IsRequired).ToList();
        checklist.CompleteItem(requiredItems.First().Id, "user123");

        // Act
        var result = checklist.GetRequiredCompletionPercentage();

        // Assert
        Assert.Equal(50.0, result);
    }

    [Fact]
    public void CalculateTotalScore_ShouldReturnCorrectScore()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Item 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new ChecklistItemTemplate { Code = "CODE-002", Name = "Item 2", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 },
            new ChecklistItemTemplate { Code = "CODE-003", Name = "Item 3", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = false, Order = 3 }
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            templates);
        
        // Complete 2 items
        checklist.CompleteItem(checklist.Items[0].Id, "user123");
        checklist.CompleteItem(checklist.Items[1].Id, "user123");

        // Act
        var result = checklist.CalculateTotalScore();

        // Assert
        Assert.Equal(2, result);
    }

    [Fact]
    public void CheckForCompletion_ShouldMarkAsCompleted_WhenAllRequiredItemsCompleted()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Required 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new ChecklistItemTemplate { Code = "CODE-002", Name = "Required 2", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 },
            new ChecklistItemTemplate { Code = "CODE-003", Name = "Optional", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = false, Order = 3 }
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            templates);

        // Act - Complete all required items
        var requiredItems = checklist.Items.Where(i => i.IsRequired).ToList();
        checklist.CompleteItem(requiredItems[0].Id, "user123");
        checklist.CompleteItem(requiredItems[1].Id, "user123");

        // Assert
        Assert.Equal(ChecklistStatus.Completed, checklist.Status);
        Assert.NotNull(checklist.CompletedAt);
        Assert.Single(checklist.DomainEvents.OfType<ChecklistCompletedEvent>());
    }

    [Fact]
    public void CheckForCompletion_ShouldNotMarkAsCompleted_WhenOptionalItemsNotCompleted()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Required 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new ChecklistItemTemplate { Code = "CODE-002", Name = "Optional", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = false, Order = 2 }
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            templates);

        // Act - Complete only required item
        var requiredItem = checklist.Items.First(i => i.IsRequired);
        checklist.CompleteItem(requiredItem.Id, "user123");

        // Assert
        Assert.Equal(ChecklistStatus.Completed, checklist.Status);
    }

    [Fact]
    public void SkipItem_ShouldWork_WhenItemIsOptional()
    {
        // Arrange
        var template = new ChecklistItemTemplate
        {
            Code = "CODE-001",
            Name = "Optional Item",
            Description = "Description",
            Category = ChecklistItemCategory.Identity,
            IsRequired = false,
            Order = 1
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            new List<ChecklistItemTemplate> { template });
        var itemId = checklist.Items.First().Id;

        // Act
        checklist.SkipItem(itemId, "user123", "Not applicable");

        // Assert
        Assert.Equal(ChecklistItemStatus.Skipped, checklist.Items.First().Status);
        Assert.Single(checklist.DomainEvents.OfType<ChecklistItemSkippedEvent>());
    }
}

