using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class DeleteEntityTypeCommandHandlerTests
{
    private readonly MockEntityTypeRepository _repositoryMock;
    private readonly DeleteEntityTypeCommandHandler _handler;

    public DeleteEntityTypeCommandHandlerTests()
    {
        _repositoryMock = new MockEntityTypeRepository();
        _handler = new DeleteEntityTypeCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldDeleteEntityType_WhenEntityTypeExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var entityType = new EntityType("CODE-001", "Test Entity", "Description");
        typeof(EntityType).GetProperty("Id")!.SetValue(entityType, entityTypeId);
        
        _repositoryMock.SetupGetById(entityTypeId, entityType);

        var command = new DeleteEntityTypeCommand(entityTypeId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task Handle_ShouldReturnFalse_WhenEntityTypeNotFound()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        _repositoryMock.SetupGetById(entityTypeId, null);

        var command = new DeleteEntityTypeCommand(entityTypeId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

