using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistItemAggregateTests
{
    [Fact]
    public void Create_ShouldCreateChecklistItem_WithAllProperties()
    {
        // Act
        var item = ChecklistItem.Create(
            "CODE-001",
            "Item Name",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);

        // Assert
        Assert.NotNull(item.Id);
        Assert.Equal("CODE-001", item.Code);
        Assert.Equal("Item Name", item.Name);
        Assert.Equal("Description", item.Description);
        Assert.Equal(ChecklistItemCategory.Identity, item.Category);
        Assert.True(item.IsRequired);
        Assert.Equal(1, item.Order);
        Assert.Equal(ChecklistItemStatus.Pending, item.Status);
    }

    [Fact]
    public void Complete_ShouldUpdateStatus_WhenNotCompleted()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Item Name",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);

        // Act
        item.Complete("user123", "Notes");

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, item.Status);
        Assert.NotNull(item.CompletedAt);
        Assert.Equal("user123", item.CompletedBy);
        Assert.Equal("Notes", item.Notes);
    }

    [Fact]
    public void Complete_ShouldDoNothing_WhenAlreadyCompleted()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Item Name",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);
        item.Complete("user1", null);
        var originalCompletedAt = item.CompletedAt;
        var originalCompletedBy = item.CompletedBy;

        // Act
        item.Complete("user2", "New notes");

        // Assert
        Assert.Equal(originalCompletedAt, item.CompletedAt);
        Assert.Equal(originalCompletedBy, item.CompletedBy);
    }

    [Fact]
    public void Skip_ShouldThrow_WhenIsRequired()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Item Name",
            "Description",
            ChecklistItemCategory.Identity,
            true, // Required
            1);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => item.Skip("user123", "Reason"));
    }

    [Fact]
    public void Skip_ShouldUpdateStatus_WhenNotRequired()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Item Name",
            "Description",
            ChecklistItemCategory.Identity,
            false, // Not required
            1);

        // Act
        item.Skip("user123", "Not applicable");

        // Assert
        Assert.Equal(ChecklistItemStatus.Skipped, item.Status);
        Assert.Equal("Not applicable", item.SkipReason);
    }

    [Fact]
    public void Reset_ShouldClearCompletionStatus()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Item Name",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);
        item.Complete("user123", "Notes");

        // Act
        item.Reset("admin", "Reset reason");

        // Assert
        Assert.Equal(ChecklistItemStatus.Pending, item.Status);
        Assert.Null(item.CompletedAt);
        Assert.Null(item.CompletedBy);
        Assert.Null(item.Notes);
    }
}

