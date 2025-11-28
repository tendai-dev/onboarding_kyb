using Microsoft.Extensions.Logging;
using OnboardingApi.Application.WorkQueue.Commands;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.WorkQueue;

public class UnassignWorkItemCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldUnassignWorkItem_WhenWorkItemExists()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new UnassignWorkItemCommandHandler(repository);
        var command = new UnassignWorkItemCommand(workItem.Id, "unassigner");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Null(workItem.AssignedTo);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new UnassignWorkItemCommandHandler(repository);
        var command = new UnassignWorkItemCommand(Guid.NewGuid(), "unassigner");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class StartReviewCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldStartReview_WhenWorkItemExistsAndAssigned()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new StartReviewCommandHandler(repository);
        var command = new StartReviewCommand(workItem.Id, "reviewer");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(WorkItemStatus.InProgress, workItem.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new StartReviewCommandHandler(repository);
        var command = new StartReviewCommand(Guid.NewGuid(), "reviewer");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class SubmitForApprovalCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldSubmitForApproval_WhenWorkItemRequiresApproval()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.High, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new SubmitForApprovalCommandHandler(repository);
        var command = new SubmitForApprovalCommand(workItem.Id, "submitter", "Notes");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(WorkItemStatus.PendingApproval, workItem.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new SubmitForApprovalCommandHandler(repository);
        var command = new SubmitForApprovalCommand(Guid.NewGuid(), "submitter", null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class ApproveWorkItemCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldApproveWorkItem_WhenAuthorized()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.High, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.SubmitForApproval("submitter");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new ApproveWorkItemCommandHandler(repository);
        var command = new ApproveWorkItemCommand(
            workItem.Id,
            Guid.NewGuid(),
            "Compliance Manager",
            "ComplianceManager",
            "Approved");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(WorkItemStatus.Approved, workItem.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new ApproveWorkItemCommandHandler(repository);
        var command = new ApproveWorkItemCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Approver",
            "Admin",
            null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class CompleteWorkItemCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldCompleteWorkItem_WhenNotRequiringApproval()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new CompleteWorkItemCommandHandler(repository);
        var command = new CompleteWorkItemCommand(workItem.Id, "completer", "Done");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(WorkItemStatus.Completed, workItem.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new CompleteWorkItemCommandHandler(repository);
        var command = new CompleteWorkItemCommand(Guid.NewGuid(), "completer", null);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class DeclineWorkItemCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldDeclineWorkItem()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new DeclineWorkItemCommandHandler(repository);
        var command = new DeclineWorkItemCommand(workItem.Id, "decliner", "Invalid documents");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(WorkItemStatus.Declined, workItem.Status);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new DeclineWorkItemCommandHandler(repository);
        var command = new DeclineWorkItemCommand(Guid.NewGuid(), "decliner", "Reason");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class AddCommentCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldAddComment_WhenWorkItemExists()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new AddCommentCommandHandler(repository);
        var command = new AddCommentCommand(workItem.Id, "Test comment", "author-id", "Author Name");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Single(workItem.Comments);
        Assert.Equal("Test comment", workItem.Comments.First().Text);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new AddCommentCommandHandler(repository);
        var command = new AddCommentCommand(Guid.NewGuid(), "Comment", "author-id", "Author");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

public class MarkForRefreshCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldMarkForRefresh_WhenWorkItemIsCompleted()
    {
        // Arrange
        var workItem = WorkItem.Create(Guid.NewGuid(), "Applicant", "Individual", "US", RiskLevel.Low, "creator");
        workItem.AssignTo(Guid.NewGuid(), "User", "assigner");
        workItem.StartReview("reviewer");
        workItem.Complete("completer", null);
        var repository = new MockWorkItemRepository();
        repository.SetupGetById(workItem.Id, workItem);
        var handler = new MarkForRefreshCommandHandler(repository);
        var command = new MarkForRefreshCommand(workItem.Id, "refresher");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(WorkItemStatus.DueForRefresh, workItem.Status);
        Assert.Equal(1, workItem.RefreshCount);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var repository = new MockWorkItemRepository();
        var handler = new MarkForRefreshCommandHandler(repository);
        var command = new MarkForRefreshCommand(Guid.NewGuid(), "refresher");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
    }
}

