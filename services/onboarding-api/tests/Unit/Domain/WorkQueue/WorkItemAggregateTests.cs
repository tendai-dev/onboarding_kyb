using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.WorkQueue;

public class WorkItemAggregateTests
{
    [Fact]
    public void AssignTo_ShouldThrowException_WhenWorkItemCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.Complete("completer", "Notes");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.AssignTo(Guid.NewGuid(), "User", "assigner"));
    }

    [Fact]
    public void Unassign_ShouldThrowException_WhenNotAssigned()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.Unassign("unassigner"));
    }

    [Fact]
    public void StartReview_ShouldThrowException_WhenNotAssigned()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.StartReview("reviewer"));
    }

    [Fact]
    public void StartReview_ShouldThrowException_WhenStatusNotAssigned()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.StartReview("reviewer"));
    }

    [Fact]
    public void SubmitForApproval_ShouldThrowException_WhenNotRequiresApproval()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.SubmitForApproval("submitter"));
    }

    [Fact]
    public void Approve_ShouldThrowException_WhenStatusNotPendingApproval()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.High,
            "creator"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.Approve(Guid.NewGuid(), "Approver", "Admin", "Notes"));
    }

    [Fact]
    public void Approve_ShouldThrowException_WhenInsufficientRoleForHighRisk()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.High,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act & Assert
        Assert.Throws<UnauthorizedAccessException>(() => workItem.Approve(Guid.NewGuid(), "Approver", "User", "Notes"));
    }

    [Fact]
    public void Complete_ShouldThrowException_WhenRequiresApprovalButNotApproved()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.High,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.Complete("completer", "Notes"));
    }

    [Fact]
    public void Decline_ShouldThrowException_WhenReasonEmpty()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act & Assert
        Assert.Throws<ArgumentException>(() => workItem.Decline("decliner", ""));
    }

    [Fact]
    public void ScheduleRefresh_ShouldThrowException_WhenStatusNotCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => workItem.ScheduleRefresh(DateTime.UtcNow.AddDays(30), "scheduler"));
    }

    [Fact]
    public void IsOverdue_ShouldReturnTrue_WhenPastDueDateAndNotCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator",
            slaDays: -1 // Due date in the past
        );

        // Act
        var result = workItem.IsOverdue;

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void Create_ShouldSetCorrectProperties()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var createdBy = "creator";

        // Act
        var workItem = WorkItem.Create(
            applicationId,
            "Applicant Name",
            "Individual",
            "US",
            RiskLevel.Medium,
            createdBy,
            slaDays: 5
        );

        // Assert
        Assert.NotEqual(Guid.Empty, workItem.Id);
        Assert.StartsWith("WI-", workItem.WorkItemNumber);
        Assert.Equal(applicationId, workItem.ApplicationId);
        Assert.Equal("Applicant Name", workItem.ApplicantName);
        Assert.Equal("Individual", workItem.EntityType);
        Assert.Equal("US", workItem.Country);
        Assert.Equal(WorkItemStatus.New, workItem.Status);
        Assert.Equal(WorkItemPriority.Medium, workItem.Priority);
        Assert.Equal(RiskLevel.Medium, workItem.RiskLevel);
        Assert.False(workItem.RequiresApproval);
        Assert.Equal(createdBy, workItem.CreatedBy);
        Assert.Single(workItem.History);
        Assert.Single(workItem.DomainEvents);
    }

    [Fact]
    public void Create_ShouldRequireApproval_WhenHighRisk()
    {
        // Act
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.High,
            "creator"
        );

        // Assert
        Assert.True(workItem.RequiresApproval);
        Assert.Equal(WorkItemPriority.High, workItem.Priority);
    }

    [Fact]
    public void AssignTo_ShouldUpdateProperties()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        var userId = Guid.NewGuid();
        var userName = "John Doe";

        // Act
        workItem.AssignTo(userId, userName, "assigner");

        // Assert
        Assert.Equal(userId, workItem.AssignedTo);
        Assert.Equal(userName, workItem.AssignedToName);
        Assert.NotNull(workItem.AssignedAt);
        Assert.Equal(WorkItemStatus.Assigned, workItem.Status);
        Assert.Equal(2, workItem.History.Count);
        Assert.Equal(2, workItem.DomainEvents.Count);
    }

    [Fact]
    public void Unassign_ShouldClearAssignment()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");

        // Act
        workItem.Unassign("unassigner");

        // Assert
        Assert.Null(workItem.AssignedTo);
        Assert.Null(workItem.AssignedToName);
        Assert.Null(workItem.AssignedAt);
        Assert.Equal(WorkItemStatus.New, workItem.Status);
    }

    [Fact]
    public void StartReview_ShouldChangeStatusToInProgress()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");

        // Act
        workItem.StartReview("reviewer");

        // Assert
        Assert.Equal(WorkItemStatus.InProgress, workItem.Status);
        Assert.Equal(3, workItem.History.Count);
    }

    [Fact]
    public void Approve_ShouldUpdateStatus_WhenAuthorized()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.High,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");
        var approverId = Guid.NewGuid();

        // Act
        workItem.Approve(approverId, "Compliance Manager", "ComplianceManager", "Approved");

        // Assert
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
        Assert.Equal(approverId, workItem.ApprovedBy);
        Assert.Equal("Compliance Manager", workItem.ApprovedByName);
        Assert.NotNull(workItem.ApprovedAt);
        Assert.Equal("Approved", workItem.ApprovalNotes);
    }

    [Fact]
    public void Complete_ShouldUpdateStatus_WhenNotRequiringApproval()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");

        // Act
        workItem.Complete("completer", "Done");

        // Assert
        Assert.Equal(WorkItemStatus.Completed, workItem.Status);
        Assert.True(workItem.IsCompleted);
        Assert.False(workItem.IsOverdue);
    }

    [Fact]
    public void Decline_ShouldUpdateStatus()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act
        workItem.Decline("decliner", "Invalid documents");

        // Assert
        Assert.Equal(WorkItemStatus.Declined, workItem.Status);
        Assert.Equal("Invalid documents", workItem.RejectionReason);
        Assert.NotNull(workItem.RejectedAt);
        Assert.True(workItem.IsCompleted);
    }

    [Fact]
    public void AddComment_ShouldAddToComments()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act
        workItem.AddComment("Test comment", "author-id", "Author Name");

        // Assert
        Assert.Single(workItem.Comments);
        Assert.Equal("Test comment", workItem.Comments.First().Text);
        Assert.Equal("Author Name", workItem.Comments.First().AuthorName);
    }

    [Fact]
    public void UpdatePriority_ShouldChangePriority()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );

        // Act
        workItem.UpdatePriority(WorkItemPriority.High, "updater");

        // Assert
        Assert.Equal(WorkItemPriority.High, workItem.Priority);
        Assert.Equal(2, workItem.History.Count);
    }

    [Fact]
    public void ScheduleRefresh_ShouldSetNextRefreshDate()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.Complete("completer", null);
        var refreshDate = DateTime.UtcNow.AddDays(30);

        // Act
        workItem.ScheduleRefresh(refreshDate, "scheduler");

        // Assert
        Assert.Equal(refreshDate, workItem.NextRefreshDate);
        Assert.Equal(5, workItem.History.Count);
    }

    [Fact]
    public void MarkForRefresh_ShouldUpdateRefreshCount()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator"
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.Complete("completer", null);
        workItem.ScheduleRefresh(DateTime.UtcNow.AddDays(30), "scheduler");

        // Act
        workItem.MarkForRefresh("refresher");

        // Assert
        Assert.Equal(WorkItemStatus.DueForRefresh, workItem.Status);
        Assert.Equal(1, workItem.RefreshCount);
        Assert.NotNull(workItem.LastRefreshedAt);
    }

    [Fact]
    public void IsOverdue_ShouldReturnFalse_WhenCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(
            Guid.NewGuid(),
            "Applicant",
            "Company",
            "US",
            RiskLevel.Low,
            "creator",
            slaDays: -1
        );
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.Complete("completer", null);

        // Act
        var result = workItem.IsOverdue;

        // Assert
        Assert.False(result);
    }
}

