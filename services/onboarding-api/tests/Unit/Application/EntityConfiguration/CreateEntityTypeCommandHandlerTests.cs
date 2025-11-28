using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class CreateEntityTypeCommandHandlerTests
{
    private readonly MockEntityTypeRepository _repositoryMock;
    private readonly CreateEntityTypeCommandHandler _handler;

    public CreateEntityTypeCommandHandlerTests()
    {
        _repositoryMock = new MockEntityTypeRepository();
        _handler = new CreateEntityTypeCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateEntityType_WhenValidCommand()
    {
        // Arrange
        var command = new CreateEntityTypeCommand(
            Code: "PRIVATE_COMPANY",
            DisplayName: "Private Company",
            Description: "A private company",
            Icon: "FiBriefcase"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("PRIVATE_COMPANY", result.Code);
        Assert.Equal("Private Company", result.DisplayName);
    }
}

