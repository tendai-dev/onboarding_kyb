using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class CreateRequirementCommandHandlerTests
{
    private readonly MockRequirementRepository _repositoryMock;
    private readonly CreateRequirementCommandHandler _handler;

    public CreateRequirementCommandHandlerTests()
    {
        _repositoryMock = new MockRequirementRepository();
        _handler = new CreateRequirementCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateRequirement_WhenCodeDoesNotExist()
    {
        // Arrange
        var code = "REQ-001";
        _repositoryMock.SetupGetByCode(code, null);

        var command = new CreateRequirementCommand(
            Code: code,
            DisplayName: "Test Requirement",
            Description: "Test Description",
            Type: "Document",
            FieldType: "File",
            ValidationRules: "required",
            HelpText: "Help text"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(code, result.Code);
        Assert.Equal("Test Requirement", result.DisplayName);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenCodeAlreadyExists()
    {
        // Arrange
        var code = "REQ-001";
        var existingRequirement = new Requirement(
            code,
            "Existing",
            "Description",
            "Document",
            "File",
            null,
            null
        );
        _repositoryMock.SetupGetByCode(code, existingRequirement);

        var command = new CreateRequirementCommand(
            Code: code,
            DisplayName: "Test Requirement",
            Description: "Test Description",
            Type: "Document",
            FieldType: "File"
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

