using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;
using Checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistAggregateTests
{
    [Fact]
    public void CompleteItem_ShouldThrowException_WhenItemNotFound()
    {
        // Arrange
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            new List<ChecklistItemTemplate>()
        );
        var nonExistentItemId = ChecklistItemId.New();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => checklist.CompleteItem(nonExistentItemId, "user123"));
    }

    [Fact]
    public void CompleteItem_ShouldNotChangeStatus_WhenAlreadyCompleted()
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
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", new List<ChecklistItemTemplate> { template });
        var itemId = checklist.Items.First().Id;
        checklist.CompleteItem(itemId, "user1");
        var originalCompletedAt = checklist.Items.First().CompletedAt;

        // Act
        checklist.CompleteItem(itemId, "user2");

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, checklist.Items.First().Status);
        Assert.Equal(originalCompletedAt, checklist.Items.First().CompletedAt);
    }

    [Fact]
    public void SkipItem_ShouldThrowException_WhenItemNotFound()
    {
        // Arrange
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            "PARTNER-456",
            new List<ChecklistItemTemplate>()
        );
        var nonExistentItemId = ChecklistItemId.New();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => checklist.SkipItem(nonExistentItemId, "user123", "Reason"));
    }

    [Fact]
    public void SkipItem_ShouldThrowException_WhenItemIsRequired()
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
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", new List<ChecklistItemTemplate> { template });
        var itemId = checklist.Items.First().Id;

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => checklist.SkipItem(itemId, "user123", "Reason"));
    }

    [Fact]
    public void ResetItem_ShouldSetStatusToInProgress_WhenChecklistWasCompleted()
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
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", new List<ChecklistItemTemplate> { template });
        var itemId = checklist.Items.First().Id;
        checklist.CompleteItem(itemId, "user123");
        Assert.Equal(ChecklistStatus.Completed, checklist.Status);

        // Act
        checklist.ResetItem(itemId, "admin", "Reset reason");

        // Assert
        Assert.Equal(ChecklistStatus.InProgress, checklist.Status);
        Assert.Null(checklist.CompletedAt);
    }

    [Fact]
    public void GetCompletionPercentage_ShouldReturnZero_WhenNoItems()
    {
        // Arrange
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", new List<ChecklistItemTemplate>());

        // Act
        var result = checklist.GetCompletionPercentage();

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public void GetCompletionPercentage_ShouldReturnCorrectPercentage()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Item 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new ChecklistItemTemplate { Code = "CODE-002", Name = "Item 2", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 }
        };
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", templates);
        checklist.CompleteItem(checklist.Items.First().Id, "user123");

        // Act
        var result = checklist.GetCompletionPercentage();

        // Assert
        Assert.Equal(50.0, result);
    }

    [Fact]
    public void GetRequiredCompletionPercentage_ShouldReturn100_WhenNoRequiredItems()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Item 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = false, Order = 1 }
        };
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", templates);

        // Act
        var result = checklist.GetRequiredCompletionPercentage();

        // Assert
        Assert.Equal(100.0, result);
    }

    [Fact]
    public void CalculateTotalScore_ShouldReturnZero_WhenNoCompletedItems()
    {
        // Arrange
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate { Code = "CODE-001", Name = "Item 1", Description = "Desc", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 }
        };
        var checklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist.Create(Guid.NewGuid().ToString(), ChecklistType.Individual, "PARTNER-456", templates);

        // Act
        var result = checklist.CalculateTotalScore();

        // Assert
        Assert.Equal(0, result);
    }
}

