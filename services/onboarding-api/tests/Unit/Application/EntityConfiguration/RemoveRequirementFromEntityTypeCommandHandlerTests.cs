using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class RemoveRequirementFromEntityTypeCommandHandlerTests
{
    private readonly MockEntityTypeRepository _repositoryMock;
    private readonly RemoveRequirementFromEntityTypeCommandHandler _handler;

    public RemoveRequirementFromEntityTypeCommandHandlerTests()
    {
        _repositoryMock = new MockEntityTypeRepository();
        _handler = new RemoveRequirementFromEntityTypeCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldRemoveRequirement_WhenEntityTypeExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var requirementId = Guid.NewGuid();
        var entityType = new EntityType("CODE-001", "Test Entity", "Description");
        typeof(EntityType).GetProperty("Id")!.SetValue(entityType, entityTypeId);
        entityType.AddRequirement(requirementId, true, 1);
        
        _repositoryMock.SetupGetById(entityTypeId, entityType);

        var command = new RemoveRequirementFromEntityTypeCommand(
            EntityTypeId: entityTypeId,
            RequirementId: requirementId
        );

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

        var command = new RemoveRequirementFromEntityTypeCommand(
            EntityTypeId: entityTypeId,
            RequirementId: Guid.NewGuid()
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

