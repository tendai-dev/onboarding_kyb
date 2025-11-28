using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistItemTests
{
    [Fact]
    public void Skip_ShouldThrowException_WhenItemIsRequired()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            isRequired: true,
            order: 1
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => item.Skip("user123", "Reason"));
    }

    [Fact]
    public void Skip_ShouldSetStatusToSkipped_WhenNotRequired()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            isRequired: false,
            order: 1
        );

        // Act
        item.Skip("user123", "Reason");

        // Assert
        Assert.Equal(ChecklistItemStatus.Skipped, item.Status);
        Assert.Equal("user123", item.CompletedBy);
        Assert.Equal("Reason", item.SkipReason);
    }

    [Fact]
    public void Complete_ShouldNotChangeStatus_WhenAlreadyCompleted()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            isRequired: true,
            order: 1
        );
        item.Complete("user1", "Notes");
        var originalCompletedAt = item.CompletedAt;

        // Act
        item.Complete("user2", "New notes");

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, item.Status);
        Assert.Equal(originalCompletedAt, item.CompletedAt);
    }

    [Fact]
    public void Reset_ShouldClearCompletedFields()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            isRequired: true,
            order: 1
        );
        item.Complete("user123", "Notes");

        // Act
        item.Reset("admin", "Reset reason");

        // Assert
        Assert.Equal(ChecklistItemStatus.Pending, item.Status);
        Assert.Null(item.CompletedAt);
        Assert.Null(item.CompletedBy);
        Assert.Null(item.Notes);
        Assert.Contains("Reset by admin", item.SkipReason!);
    }
}

