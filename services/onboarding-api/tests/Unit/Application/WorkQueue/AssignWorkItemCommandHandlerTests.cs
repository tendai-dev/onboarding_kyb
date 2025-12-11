using OnboardingApi.Application.WorkQueue.Commands;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.WorkQueue;

public class AssignWorkItemCommandHandlerTests
{
    private readonly MockWorkItemRepository _repositoryMock;
    private readonly MockLogger<AssignWorkItemCommandHandler> _loggerMock;
    private readonly AssignWorkItemCommandHandler _handler;

    public AssignWorkItemCommandHandlerTests()
    {
        _repositoryMock = new MockWorkItemRepository();
        _loggerMock = new MockLogger<AssignWorkItemCommandHandler>();

        _handler = new AssignWorkItemCommandHandler(
            _repositoryMock,
            _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldAssignWorkItem_WhenWorkItemExists()
    {
        // Arrange
        var workItemId = Guid.NewGuid();
        var assignedToUserId = Guid.NewGuid();
        var workItem = CreateTestWorkItem(workItemId);
        _repositoryMock.SetupGetById(workItemId, workItem);

        var command = new AssignWorkItemCommand(
            WorkItemId: workItemId,
            AssignedToUserId: assignedToUserId,
            AssignedToUserName: "John Doe",
            AssignedByUserId: "admin@example.com"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal(assignedToUserId, workItem.AssignedTo);
        Assert.Equal("John Doe", workItem.AssignedToName);

        var updatedWorkItem = await _repositoryMock.GetByIdAsync(workItemId, CancellationToken.None);
        Assert.NotNull(updatedWorkItem);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemNotFound()
    {
        // Arrange
        var workItemId = Guid.NewGuid();
        _repositoryMock.SetupGetById(workItemId, null);

        var command = new AssignWorkItemCommand(
            WorkItemId: workItemId,
            AssignedToUserId: Guid.NewGuid(),
            AssignedToUserName: "John Doe",
            AssignedByUserId: "admin@example.com"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.Success);
        Assert.Contains("not found", result.ErrorMessage);
    }

    private static WorkItem CreateTestWorkItem(Guid id)
    {
        var workItem = WorkItem.Create(
            applicationId: Guid.NewGuid(),
            applicantName: "Test User",
            entityType: "Individual",
            country: "US",
            riskLevel: RiskLevel.Medium,
            createdBy: "system@example.com",
            slaDays: 5
        );

        typeof(WorkItem)
            .GetProperty(nameof(WorkItem.Id))!
            .SetValue(workItem, id);

        return workItem;
    }
}
