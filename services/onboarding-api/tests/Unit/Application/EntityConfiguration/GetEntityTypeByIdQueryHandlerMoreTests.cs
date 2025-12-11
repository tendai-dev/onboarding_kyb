using OnboardingApi.Application.EntityConfiguration.Queries;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class GetEntityTypeByIdQueryHandlerMoreTests
{
    [Fact]
    public async Task Handle_ShouldReturnNull_WhenEntityTypeNotFound()
    {
        // Arrange
        var repository = new MockEntityTypeRepository();
        var logger = new MockLogger<GetEntityTypeByIdQueryHandler>();
        var handler = new GetEntityTypeByIdQueryHandler(repository, logger);
        var query = new GetEntityTypeByIdQuery(Guid.NewGuid(), false);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyRequirementsList_WhenIncludeRequirementsIsFalse()
    {
        // Arrange
        var entityType = new EntityType("INDIVIDUAL", "Individual", "Individual entity type");
        var repository = new MockEntityTypeRepository();
        repository.SetupGetById(entityType.Id, entityType);
        var logger = new MockLogger<GetEntityTypeByIdQueryHandler>();
        var handler = new GetEntityTypeByIdQueryHandler(repository, logger);
        var query = new GetEntityTypeByIdQuery(entityType.Id, false);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Requirements);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyRequirementsList_WhenIncludeRequirementsIsTrueButNoRequirements()
    {
        // Arrange
        var entityType = new EntityType("INDIVIDUAL", "Individual", "Individual entity type");
        var repository = new MockEntityTypeRepository();
        repository.SetupGetById(entityType.Id, entityType);
        var logger = new MockLogger<GetEntityTypeByIdQueryHandler>();
        var handler = new GetEntityTypeByIdQueryHandler(repository, logger);
        var query = new GetEntityTypeByIdQuery(entityType.Id, true);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Requirements);
    }

    [Fact]
    public async Task Handle_ShouldReturnRequirements_WhenIncludeRequirementsIsTrueAndRequirementsExist()
    {
        // Arrange
        var entityType = new EntityType("INDIVIDUAL", "Individual", "Individual entity type");
        var requirement = new Requirement("REQ1", "Requirement 1", "Description", "DOCUMENTATION", "file");
        entityType.AddRequirement(requirement.Id, true, 1);
        
        var repository = new MockEntityTypeRepository();
        repository.SetupGetById(entityType.Id, entityType);
        var logger = new MockLogger<GetEntityTypeByIdQueryHandler>();
        var handler = new GetEntityTypeByIdQueryHandler(repository, logger);
        var query = new GetEntityTypeByIdQuery(entityType.Id, true);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Requirements);
        Assert.Single(result.Requirements);
    }
}

