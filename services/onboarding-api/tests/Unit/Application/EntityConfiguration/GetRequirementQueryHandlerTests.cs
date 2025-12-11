using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Application.EntityConfiguration.Queries;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class GetAllRequirementsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnAllRequirements_WhenIncludeInactiveIsFalse()
    {
        // Arrange
        var requirement1 = new Requirement("REQ1", "Requirement 1", "Description 1", "document", "file");
        var requirement2 = new Requirement("REQ2", "Requirement 2", "Description 2", "document", "file");
        
        var repository = new MockRequirementRepository();
        await repository.AddAsync(requirement1, CancellationToken.None);
        await repository.AddAsync(requirement2, CancellationToken.None);

        var handler = new GetAllRequirementsQueryHandler(repository);
        var query = new GetAllRequirementsQuery(IncludeInactive: false);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoRequirements()
    {
        // Arrange
        var repository = new MockRequirementRepository();
        var handler = new GetAllRequirementsQueryHandler(repository);
        var query = new GetAllRequirementsQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}

public class GetRequirementByIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnRequirementDto_WhenRequirementExists()
    {
        // Arrange
        var requirement = new Requirement("REQ1", "Requirement 1", "Description 1", "document", "file");
        var repository = new MockRequirementRepository();
        await repository.AddAsync(requirement, CancellationToken.None);

        var handler = new GetRequirementByIdQueryHandler(repository);
        var query = new GetRequirementByIdQuery(requirement.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(requirement.Id, result.Id);
        Assert.Equal("REQ1", result.Code);
        Assert.Equal("Requirement 1", result.DisplayName);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenRequirementNotFound()
    {
        // Arrange
        var repository = new MockRequirementRepository();
        var handler = new GetRequirementByIdQueryHandler(repository);
        var query = new GetRequirementByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetRequirementByCodeQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnRequirementDto_WhenRequirementExists()
    {
        // Arrange
        var requirement = new Requirement("REQ1", "Requirement 1", "Description 1", "document", "file");
        var repository = new MockRequirementRepository();
        await repository.AddAsync(requirement, CancellationToken.None);

        var handler = new GetRequirementByCodeQueryHandler(repository);
        var query = new GetRequirementByCodeQuery("REQ1");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("REQ1", result.Code);
        Assert.Equal("Requirement 1", result.DisplayName);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenRequirementNotFound()
    {
        // Arrange
        var repository = new MockRequirementRepository();
        var handler = new GetRequirementByCodeQueryHandler(repository);
        var query = new GetRequirementByCodeQuery("NONEXISTENT");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

