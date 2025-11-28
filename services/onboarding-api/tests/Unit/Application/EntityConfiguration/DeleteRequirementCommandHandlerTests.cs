using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class DeleteRequirementCommandHandlerTests
{
    private readonly MockRequirementRepository _repositoryMock;
    private readonly DeleteRequirementCommandHandler _handler;

    public DeleteRequirementCommandHandlerTests()
    {
        _repositoryMock = new MockRequirementRepository();
        _handler = new DeleteRequirementCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldDeleteRequirement_WhenRequirementExists()
    {
        // Arrange
        var requirementId = Guid.NewGuid();
        var requirement = new Requirement(
            "REQ-001",
            "Test Requirement",
            "Description",
            "Document",
            "File",
            null,
            null
        );
        typeof(Requirement).GetProperty("Id")!.SetValue(requirement, requirementId);
        
        _repositoryMock.SetupGetById(requirementId, requirement);

        var command = new DeleteRequirementCommand(requirementId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task Handle_ShouldReturnFalse_WhenRequirementNotFound()
    {
        // Arrange
        var requirementId = Guid.NewGuid();
        _repositoryMock.SetupGetById(requirementId, null);

        var command = new DeleteRequirementCommand(requirementId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

