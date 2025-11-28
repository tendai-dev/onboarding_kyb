using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class AddRequirementToEntityTypeCommandHandlerTests
{
    private readonly MockEntityTypeRepository _repositoryMock;
    private readonly AddRequirementToEntityTypeCommandHandler _handler;

    public AddRequirementToEntityTypeCommandHandlerTests()
    {
        _repositoryMock = new MockEntityTypeRepository();
        _handler = new AddRequirementToEntityTypeCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldAddRequirement_WhenEntityTypeExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var requirementId = Guid.NewGuid();
        var entityType = new EntityType("CODE-001", "Test Entity", "Description");
        typeof(EntityType).GetProperty("Id")!.SetValue(entityType, entityTypeId);
        
        _repositoryMock.SetupGetById(entityTypeId, entityType);

        var command = new AddRequirementToEntityTypeCommand(
            EntityTypeId: entityTypeId,
            RequirementId: requirementId,
            IsRequired: true,
            DisplayOrder: 1
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

        var command = new AddRequirementToEntityTypeCommand(
            EntityTypeId: entityTypeId,
            RequirementId: Guid.NewGuid(),
            IsRequired: true,
            DisplayOrder: 1
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

