using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistCompletionTests
{
    [Fact]
    public void CheckForCompletion_ShouldNotChangeStatus_WhenAlreadyCompleted()
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
        checklist.CompleteItem(itemId, "completer");
        // Checklist should now be completed
        Assert.Equal(ChecklistStatus.Completed, checklist.Status);
        var initialCompletedAt = checklist.CompletedAt;

        // Act - Try to complete again (should not change status)
        checklist.CompleteItem(itemId, "completer2");

        // Assert
        Assert.Equal(ChecklistStatus.Completed, checklist.Status);
        Assert.Equal(initialCompletedAt, checklist.CompletedAt);
    }

    [Fact]
    public void CheckForCompletion_ShouldNotComplete_WhenNotAllRequiredItemsCompleted()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new() { Code = "CODE-001", Name = "Item 1", Description = "Description", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new() { Code = "CODE-002", Name = "Item 2", Description = "Description", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 }
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            templates);

        var item1Id = checklist.Items.First(i => i.Code == "CODE-001").Id;
        checklist.CompleteItem(item1Id, "completer");
        // Only one of two required items completed

        // Assert
        Assert.NotEqual(ChecklistStatus.Completed, checklist.Status);
        Assert.Null(checklist.CompletedAt);
    }

    [Fact]
    public void CheckForCompletion_ShouldComplete_WhenAllRequiredItemsCompleted()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new() { Code = "CODE-001", Name = "Item 1", Description = "Description", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new() { Code = "CODE-002", Name = "Item 2", Description = "Description", Category = ChecklistItemCategory.Identity, IsRequired = false, Order = 2 }
        };
        var checklist = DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            templates);

        var item1Id = checklist.Items.First(i => i.Code == "CODE-001").Id;
        checklist.CompleteItem(item1Id, "completer");
        // All required items completed (only CODE-001 is required)

        // Assert
        Assert.Equal(ChecklistStatus.Completed, checklist.Status);
        Assert.NotNull(checklist.CompletedAt);
    }
}

