using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class UpdateEntityTypeCommandHandlerTests
{
    private readonly MockEntityTypeRepository _repositoryMock;
    private readonly UpdateEntityTypeCommandHandler _handler;

    public UpdateEntityTypeCommandHandlerTests()
    {
        _repositoryMock = new MockEntityTypeRepository();
        _handler = new UpdateEntityTypeCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldUpdateEntityType_WhenEntityTypeExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var entityType = new EntityType("CODE-001", "Original Name", "Original Description");
        typeof(EntityType).GetProperty("Id")!.SetValue(entityType, entityTypeId);
        
        _repositoryMock.SetupGetById(entityTypeId, entityType);

        var command = new UpdateEntityTypeCommand(
            Id: entityTypeId,
            DisplayName: "Updated Name",
            Description: "Updated Description",
            IsActive: true,
            Icon: "UpdatedIcon"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entityTypeId, result.Id);
        Assert.Equal("CODE-001", result.Code);
        Assert.Equal("Updated Name", result.DisplayName);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenEntityTypeNotFound()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        _repositoryMock.SetupGetById(entityTypeId, null);

        var command = new UpdateEntityTypeCommand(
            Id: entityTypeId,
            DisplayName: "Updated Name",
            Description: "Updated Description",
            IsActive: null,
            Icon: null
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

