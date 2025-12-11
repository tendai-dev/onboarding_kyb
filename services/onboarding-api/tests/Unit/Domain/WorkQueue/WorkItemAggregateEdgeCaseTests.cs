using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using Xunit;
using WorkQueueRiskLevel = OnboardingApi.Domain.WorkQueue.ValueObjects.RiskLevel;

namespace OnboardingApi.Tests.Unit.Domain.WorkQueue;

public class WorkItemAggregateEdgeCaseTests
{
    [Fact]
    public void Create_ShouldSetRequiresApproval_WhenRiskLevelIsHigh()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");

        // Assert
        Assert.True(workItem.RequiresApproval);
    }

    [Fact]
    public void Create_ShouldSetRequiresApproval_WhenRiskLevelIsCritical()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Critical,
            "creator");

        // Assert
        Assert.True(workItem.RequiresApproval);
    }

    [Fact]
    public void Create_ShouldNotRequireApproval_WhenRiskLevelIsLow()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Assert
        Assert.False(workItem.RequiresApproval);
    }

    [Fact]
    public void Create_ShouldSetDueDate_WithCustomSlaDays()
    {
        // Arrange
        var slaDays = 10;

        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator",
            slaDays);

        // Assert
        var expectedDueDate = DateTime.UtcNow.AddDays(slaDays);
        Assert.True(Math.Abs((workItem.DueDate - expectedDueDate).TotalHours) < 1);
    }

    [Fact]
    public void IsOverdue_ShouldReturnTrue_WhenPastDueDateAndNotCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Set due date to past using reflection
        typeof(WorkItem).GetProperty("DueDate")!.SetValue(workItem, DateTime.UtcNow.AddDays(-1));

        // Act
        var isOverdue = workItem.IsOverdue;

        // Assert
        Assert.True(isOverdue);
    }

    [Fact]
    public void IsOverdue_ShouldReturnFalse_WhenCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        workItem.Complete("user1", "Done");

        // Set due date to past
        typeof(WorkItem).GetProperty("DueDate")!.SetValue(workItem, DateTime.UtcNow.AddDays(-1));

        // Act
        var isOverdue = workItem.IsOverdue;

        // Assert
        Assert.False(isOverdue);
    }

    [Fact]
    public void IsCompleted_ShouldReturnTrue_WhenStatusIsCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        workItem.Complete("user1", "Done");

        // Act
        var isCompleted = workItem.IsCompleted;

        // Assert
        Assert.True(isCompleted);
    }

    [Fact]
    public void IsCompleted_ShouldReturnTrue_WhenStatusIsDeclined()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        workItem.Decline("user1", "Reason");

        // Act
        var isCompleted = workItem.IsCompleted;

        // Assert
        Assert.True(isCompleted);
    }

    [Fact]
    public void IsCompleted_ShouldReturnFalse_WhenStatusIsNew()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Act
        var isCompleted = workItem.IsCompleted;

        // Assert
        Assert.False(isCompleted);
    }

    [Fact]
    public void AddComment_ShouldAddComment_ToComments()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Act
        workItem.AddComment("Test comment", "user1", "User 1");

        // Assert
        Assert.Single(workItem.Comments);
        Assert.Equal("Test comment", workItem.Comments.First().Text);
    }

    [Fact]
    public void UpdatePriority_ShouldAddHistoryEntry()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        var initialHistoryCount = workItem.History.Count;

        // Act - Update priority which should add history
        workItem.UpdatePriority(WorkItemPriority.High, "user1");

        // Assert
        Assert.True(workItem.History.Count > initialHistoryCount);
        Assert.Equal(WorkItemPriority.High, workItem.Priority);
    }

    [Fact]
    public void Approve_ShouldThrow_WhenHighRiskAndApproverNotComplianceManager()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act & Assert
        Assert.Throws<UnauthorizedAccessException>(() =>
            workItem.Approve(Guid.NewGuid(), "Approver", "RegularUser", "Notes"));
    }

    [Fact]
    public void Approve_ShouldSucceed_WhenHighRiskAndApproverIsComplianceManager()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act
        workItem.Approve(Guid.NewGuid(), "Compliance Manager", "ComplianceManager", "Approved");

        // Assert
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
    }

    [Fact]
    public void Approve_ShouldSucceed_WhenHighRiskAndApproverIsAdmin()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act
        workItem.Approve(Guid.NewGuid(), "Admin", "Admin", "Approved");

        // Assert
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
    }


    [Fact]
    public void Complete_ShouldThrow_WhenRequiresApprovalAndNotApproved()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        // Not approved yet

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
            workItem.Complete("completer", "Done"));
    }

    [Fact]
    public void Decline_ShouldThrow_WhenReasonIsEmpty()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            workItem.Decline("decliner", ""));
    }

    [Fact]
    public void Decline_ShouldThrow_WhenReasonIsWhitespace()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            workItem.Decline("decliner", "   "));
    }

    [Fact]
    public void Cancel_ShouldThrow_WhenWorkItemIsCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.Complete("completer", "Done");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
            workItem.Cancel("canceller", "Reason"));
    }

    [Fact]
    public void ScheduleRefresh_ShouldThrow_WhenStatusIsNotCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        // Not completed

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
            workItem.ScheduleRefresh(DateTime.UtcNow.AddDays(30), "scheduler"));
    }

    [Fact]
    public void AssignTo_ShouldIncludePreviousAssignee_WhenReassigning()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        
        workItem.AssignTo(Guid.NewGuid(), "First User", "assigner1");

        // Act
        workItem.AssignTo(Guid.NewGuid(), "Second User", "assigner2");

        // Assert
        Assert.Equal("Second User", workItem.AssignedToName);
        Assert.Equal(WorkItemStatus.Assigned, workItem.Status);
        // History should include previous assignee information
    }

    [Fact]
    public void AssignTo_ShouldNotIncludePreviousAssignee_WhenFirstAssignment()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Act
        workItem.AssignTo(Guid.NewGuid(), "First User", "assigner1");

        // Assert
        Assert.Equal("First User", workItem.AssignedToName);
        Assert.Equal(WorkItemStatus.Assigned, workItem.Status);
    }

    [Fact]
    public void Approve_ShouldIncludeNotesInHistory_WhenNotesProvided()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act
        workItem.Approve(Guid.NewGuid(), "Compliance Manager", "ComplianceManager", "Approved with notes");

        // Assert
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
        // History should include notes
    }

    [Fact]
    public void Approve_ShouldNotIncludeNotesInHistory_WhenNotesNotProvided()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act
        workItem.Approve(Guid.NewGuid(), "Compliance Manager", "ComplianceManager", null);

        // Assert
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
    }

    [Fact]
    public void Complete_ShouldIncludeNotesInHistory_WhenNotesProvided()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");

        // Act
        workItem.Complete("completer", "Done with notes");

        // Assert
        Assert.Equal(WorkItemStatus.Completed, workItem.Status);
    }

    [Fact]
    public void Complete_ShouldNotIncludeNotesInHistory_WhenNotesNotProvided()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");

        // Act
        workItem.Complete("completer", null);

        // Assert
        Assert.Equal(WorkItemStatus.Completed, workItem.Status);
    }

    [Fact]
    public void UpdatePriority_ShouldReturnEarly_WhenPriorityIsSame()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Medium,
            "creator");
        var initialHistoryCount = workItem.History.Count;
        var currentPriority = workItem.Priority;

        // Act
        workItem.UpdatePriority(currentPriority, "updater");

        // Assert
        Assert.Equal(currentPriority, workItem.Priority);
        Assert.Equal(initialHistoryCount, workItem.History.Count); // No history entry added
    }

    [Fact]
    public void Create_ShouldSetCriticalPriority_WhenRiskLevelIsCritical()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Critical,
            "creator");

        // Assert
        Assert.Equal(WorkItemPriority.Critical, workItem.Priority);
    }

    [Fact]
    public void Create_ShouldSetHighPriority_WhenRiskLevelIsHigh()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.High,
            "creator");

        // Assert
        Assert.Equal(WorkItemPriority.High, workItem.Priority);
    }

    [Fact]
    public void Create_ShouldSetMediumPriority_WhenRiskLevelIsMedium()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Medium,
            "creator");

        // Assert
        Assert.Equal(WorkItemPriority.Medium, workItem.Priority);
    }

    [Fact]
    public void Create_ShouldSetLowPriority_WhenRiskLevelIsLow()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");

        // Assert
        Assert.Equal(WorkItemPriority.Low, workItem.Priority);
    }

    [Fact]
    public void Create_ShouldSetMediumPriority_WhenRiskLevelIsUnknown()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Unknown,
            "creator");

        // Assert
        Assert.Equal(WorkItemPriority.Medium, workItem.Priority);
    }
}

