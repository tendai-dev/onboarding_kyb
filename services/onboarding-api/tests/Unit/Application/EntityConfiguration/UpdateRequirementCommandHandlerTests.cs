using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class UpdateRequirementCommandHandlerTests
{
    private readonly MockRequirementRepository _repositoryMock;
    private readonly UpdateRequirementCommandHandler _handler;

    public UpdateRequirementCommandHandlerTests()
    {
        _repositoryMock = new MockRequirementRepository();
        _handler = new UpdateRequirementCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldUpdateRequirement_WhenRequirementExists()
    {
        // Arrange
        var requirementId = Guid.NewGuid();
        var requirement = new Requirement(
            "REQ-001",
            "Original Name",
            "Original Description",
            "Document",
            "File",
            null,
            null
        );
        typeof(Requirement).GetProperty("Id")!.SetValue(requirement, requirementId);
        
        _repositoryMock.SetupGetById(requirementId, requirement);

        var command = new UpdateRequirementCommand(
            Id: requirementId,
            DisplayName: "Updated Name",
            Description: "Updated Description",
            ValidationRules: "required",
            HelpText: "Updated help text",
            IsActive: true
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(requirementId, result.Id);
        Assert.Equal("REQ-001", result.Code);
        Assert.Equal("Updated Name", result.DisplayName);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenRequirementNotFound()
    {
        // Arrange
        var requirementId = Guid.NewGuid();
        _repositoryMock.SetupGetById(requirementId, null);

        var command = new UpdateRequirementCommand(
            Id: requirementId,
            DisplayName: "Updated Name",
            Description: "Updated Description"
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

