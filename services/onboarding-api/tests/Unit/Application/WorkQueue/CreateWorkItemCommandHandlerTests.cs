using OnboardingApi.Application.WorkQueue.Commands;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.WorkQueue;

public class CreateWorkItemCommandHandlerTests
{
    private readonly MockWorkItemRepository _repositoryMock;
    private readonly MockLogger<CreateWorkItemCommandHandler> _loggerMock;
    private readonly CreateWorkItemCommandHandler _handler;

    public CreateWorkItemCommandHandlerTests()
    {
        _repositoryMock = new MockWorkItemRepository();
        _loggerMock = new MockLogger<CreateWorkItemCommandHandler>();

        _handler = new CreateWorkItemCommandHandler(
            _repositoryMock,
            _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateWorkItem_WithValidCommand()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var command = new CreateWorkItemCommand(
            ApplicationId: applicationId,
            ApplicantName: "John Doe",
            EntityType: "Individual",
            Country: "US",
            RiskLevel: "Medium",
            CreatedBy: "system@example.com",
            SlaDays: 5
        );

        _repositoryMock.SetupGetByApplicationId(applicationId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.WorkItemId);

        var addedWorkItem = await _repositoryMock.GetByApplicationIdAsync(applicationId, CancellationToken.None);
        Assert.NotNull(addedWorkItem);
        Assert.Equal("John Doe", addedWorkItem!.ApplicantName);
        Assert.Equal("Individual", addedWorkItem.EntityType);
        Assert.Equal("US", addedWorkItem.Country);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenWorkItemAlreadyExists()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var existingWorkItem = CreateTestWorkItem(Guid.NewGuid());
        existingWorkItem.GetType().GetProperty("ApplicationId")!.SetValue(existingWorkItem, applicationId);

        _repositoryMock.SetupGetByApplicationId(applicationId, existingWorkItem);

        var command = new CreateWorkItemCommand(
            ApplicationId: applicationId,
            ApplicantName: "John Doe",
            EntityType: "Individual",
            Country: "US",
            RiskLevel: "Medium",
            CreatedBy: "system@example.com"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.Success);
        Assert.Contains("already exists", result.ErrorMessage);
    }

    [Fact]
    public async Task Handle_ShouldParseRiskLevel_WhenValid()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var command = new CreateWorkItemCommand(
            ApplicationId: applicationId,
            ApplicantName: "John Doe",
            EntityType: "Individual",
            Country: "US",
            RiskLevel: "High",
            CreatedBy: "system@example.com"
        );

        _repositoryMock.SetupGetByApplicationId(applicationId, null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var addedWorkItem = await _repositoryMock.GetByApplicationIdAsync(applicationId, CancellationToken.None);
        Assert.NotNull(addedWorkItem);
        Assert.Equal(RiskLevel.High, addedWorkItem!.RiskLevel);
    }

    [Fact]
    public async Task Handle_ShouldUseUnknownRiskLevel_WhenInvalidRiskLevelProvided()
    {
        // Arrange
        var applicationId = Guid.NewGuid();
        var command = new CreateWorkItemCommand(
            ApplicationId: applicationId,
            ApplicantName: "John Doe",
            EntityType: "Individual",
            Country: "US",
            RiskLevel: "InvalidRiskLevel",
            CreatedBy: "system@example.com"
        );

        _repositoryMock.SetupGetByApplicationId(applicationId, null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var addedWorkItem = await _repositoryMock.GetByApplicationIdAsync(applicationId, CancellationToken.None);
        Assert.NotNull(addedWorkItem);
        Assert.Equal(RiskLevel.Unknown, addedWorkItem!.RiskLevel);
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
