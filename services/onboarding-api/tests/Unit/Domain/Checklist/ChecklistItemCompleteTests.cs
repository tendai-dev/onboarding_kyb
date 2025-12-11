using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Checklist;

public class ChecklistItemCompleteTests
{
    [Fact]
    public void Complete_ShouldReturnEarly_WhenStatusIsAlreadyCompleted()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);
        
        item.Complete("completer1", "First completion");
        var initialCompletedAt = item.CompletedAt;
        var initialCompletedBy = item.CompletedBy;

        // Act
        item.Complete("completer2", "Second completion");

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, item.Status);
        Assert.Equal(initialCompletedAt, item.CompletedAt); // Should not change
        Assert.Equal(initialCompletedBy, item.CompletedBy); // Should not change
    }

    [Fact]
    public void Complete_ShouldClearSkipReason_WhenCompletingPreviouslySkippedItem()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            false, // Not required
            1);
        
        item.Skip("skipper", "Skip reason");
        Assert.NotNull(item.SkipReason);

        // Act
        item.Complete("completer", "Notes");

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, item.Status);
        Assert.Null(item.SkipReason); // Should be cleared
    }

    [Fact]
    public void Complete_ShouldSetNotes_WhenNotesProvided()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);

        // Act
        item.Complete("completer", "Completion notes");

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, item.Status);
        Assert.Equal("Completion notes", item.Notes);
    }

    [Fact]
    public void Complete_ShouldNotSetNotes_WhenNotesNotProvided()
    {
        // Arrange
        var item = ChecklistItem.Create(
            "CODE-001",
            "Test Item",
            "Description",
            ChecklistItemCategory.Identity,
            true,
            1);

        // Act
        item.Complete("completer", null);

        // Assert
        Assert.Equal(ChecklistItemStatus.Completed, item.Status);
        Assert.Null(item.Notes);
    }
}

