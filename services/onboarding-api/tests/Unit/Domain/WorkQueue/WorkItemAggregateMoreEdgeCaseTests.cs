using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using Xunit;
using WorkQueueRiskLevel = OnboardingApi.Domain.WorkQueue.ValueObjects.RiskLevel;

namespace OnboardingApi.Tests.Unit.Domain.WorkQueue;

public class WorkItemAggregateMoreEdgeCaseTests
{
    [Fact]
    public void Approve_ShouldThrow_WhenStatusNotPendingApproval()
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
        Assert.Throws<InvalidOperationException>(() => 
            workItem.Approve(Guid.NewGuid(), "Approver", "Admin", "Notes"));
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
        var reviewerId = Guid.NewGuid();
        workItem.AssignTo(reviewerId, "Reviewer", "admin");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("reviewer");

        // Act & Assert
        Assert.Throws<UnauthorizedAccessException>(() => 
            workItem.Approve(Guid.NewGuid(), "Approver", "Reviewer", "Notes"));
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
        var reviewerId = Guid.NewGuid();
        workItem.AssignTo(reviewerId, "Reviewer", "admin");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("reviewer");

        // Act
        workItem.Approve(Guid.NewGuid(), "Approver", "ComplianceManager", "Notes");

        // Assert
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
        Assert.NotNull(workItem.ApprovedAt);
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
        var reviewerId = Guid.NewGuid();
        workItem.AssignTo(reviewerId, "Reviewer", "admin");
        workItem.StartReview("reviewer");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            workItem.Complete("user1", "Done"));
    }

    [Fact]
    public void Complete_ShouldThrow_WhenAlreadyCompleted()
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

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            workItem.Complete("user2", "Done again"));
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
            workItem.Decline("user1", ""));
    }

    [Fact]
    public void Decline_ShouldThrow_WhenAlreadyCompleted()
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

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            workItem.Decline("user2", "Reason"));
    }

    [Fact]
    public void Cancel_ShouldThrow_WhenAlreadyCompleted()
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

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            workItem.Cancel("user2", "Reason"));
    }

    [Fact]
    public void ScheduleRefresh_ShouldThrow_WhenStatusNotCompleted()
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
        Assert.Throws<InvalidOperationException>(() => 
            workItem.ScheduleRefresh(DateTime.UtcNow.AddDays(30), "user1"));
    }

    [Fact]
    public void ScheduleRefresh_ShouldSetNextRefreshDate()
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
        var refreshDate = DateTime.UtcNow.AddDays(30);

        // Act
        workItem.ScheduleRefresh(refreshDate, "user1");

        // Assert
        Assert.Equal(refreshDate.Date, workItem.NextRefreshDate?.Date);
    }

    [Fact]
    public void UpdatePriority_ShouldDoNothing_WhenPriorityUnchanged()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Individual",
            "US",
            WorkQueueRiskLevel.Low,
            "creator");
        var initialPriority = workItem.Priority;
        var initialHistoryCount = workItem.History.Count;

        // Act
        workItem.UpdatePriority(initialPriority, "user1");

        // Assert
        Assert.Equal(initialPriority, workItem.Priority);
        Assert.Equal(initialHistoryCount, workItem.History.Count);
    }
}

