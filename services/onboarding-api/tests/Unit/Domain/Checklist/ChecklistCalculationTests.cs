using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistCalculationTests
{
    [Fact]
    public void GetRequiredCompletionPercentage_ShouldReturn100_WhenNoRequiredItems()
    {
        // Arrange
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            new List<ChecklistItemTemplate>
            {
                new() { Code = "ITEM1", Name = "Item 1", IsRequired = false, Order = 1 },
                new() { Code = "ITEM2", Name = "Item 2", IsRequired = false, Order = 2 }
            });

        // Act
        var result = checklist.GetRequiredCompletionPercentage();

        // Assert
        Assert.Equal(100, result);
    }

    [Fact]
    public void GetRequiredCompletionPercentage_ShouldCalculate_WhenRequiredItemsExist()
    {
        // Arrange
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            new List<ChecklistItemTemplate>
            {
                new() { Code = "ITEM1", Name = "Item 1", IsRequired = true, Order = 1 },
                new() { Code = "ITEM2", Name = "Item 2", IsRequired = true, Order = 2 },
                new() { Code = "ITEM3", Name = "Item 3", IsRequired = false, Order = 3 }
            });

        var item1 = checklist.Items.First(i => i.Code == "ITEM1");
        checklist.CompleteItem(item1.Id, "completer");

        // Act
        var result = checklist.GetRequiredCompletionPercentage();

        // Assert
        Assert.Equal(50, result); // 1 out of 2 required items completed
    }

    [Fact]
    public void CalculateTotalScore_ShouldReturn0_WhenNoCompletedItems()
    {
        // Arrange
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            new List<ChecklistItemTemplate>
            {
                new() { Code = "ITEM1", Name = "Item 1", IsRequired = true, Order = 1 },
                new() { Code = "ITEM2", Name = "Item 2", IsRequired = true, Order = 2 }
            });

        // Act
        var result = checklist.CalculateTotalScore();

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateTotalScore_ShouldCalculate_WhenCompletedItemsExist()
    {
        // Arrange
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            new List<ChecklistItemTemplate>
            {
                new() { Code = "ITEM1", Name = "Item 1", IsRequired = true, Order = 1 },
                new() { Code = "ITEM2", Name = "Item 2", IsRequired = true, Order = 2 },
                new() { Code = "ITEM3", Name = "Item 3", IsRequired = false, Order = 3 }
            });

        var item1 = checklist.Items.First(i => i.Code == "ITEM1");
        var item2 = checklist.Items.First(i => i.Code == "ITEM2");
        checklist.CompleteItem(item1.Id, "completer");
        checklist.CompleteItem(item2.Id, "completer");

        // Act
        var result = checklist.CalculateTotalScore();

        // Assert
        Assert.Equal(2, result); // 2 completed items
    }

    [Fact]
    public void GetCompletionPercentage_ShouldReturn0_WhenNoItems()
    {
        // Arrange
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            new List<ChecklistItemTemplate>());

        // Act
        var result = checklist.GetCompletionPercentage();

        // Assert
        Assert.Equal(0, result);
    }
}

