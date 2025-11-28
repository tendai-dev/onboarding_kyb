using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class RequirementRepositoryTests
{
    private readonly MockLogger<RequirementRepository> _logger;

    public RequirementRepositoryTests()
    {
        _logger = new MockLogger<RequirementRepository>();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnRequirement_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement = new Requirement(
            "REQ001",
            "Test Requirement",
            "Test Description",
            "document",
            "text");

        context.Set<Requirement>().Add(requirement);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(requirement.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(requirement.Id, result.Id);
        Assert.Equal("REQ001", result.Code);
    }

    [Fact]
    public async Task GetByCodeAsync_ShouldReturnRequirement_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var code = "REQ001";
        var requirement = new Requirement(code, "Test Requirement", "Test Description", "document", "text");

        context.Set<Requirement>().Add(requirement);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByCodeAsync(code, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(code, result.Code);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnOnlyActiveRequirements_ByDefault()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement1 = new Requirement("REQ001", "Requirement 1", "Description 1", "document", "text");
        var requirement2 = new Requirement("REQ002", "Requirement 2", "Description 2", "document", "text");
        var requirement3 = new Requirement("REQ003", "Requirement 3", "Description 3", "document", "text");
        requirement3.Deactivate();

        context.Set<Requirement>().AddRange(requirement1, requirement2, requirement3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(includeInactive: false, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, r => Assert.True(r.IsActive));
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllRequirements_WhenIncludeInactive()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement1 = new Requirement("REQ001", "Requirement 1", "Description 1", "document", "text");
        var requirement2 = new Requirement("REQ002", "Requirement 2", "Description 2", "document", "text");
        requirement2.Deactivate();

        context.Set<Requirement>().AddRange(requirement1, requirement2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetAllAsync(includeInactive: true, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task AddAsync_ShouldAddRequirement()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement = new Requirement("REQ001", "Test Requirement", "Test Description", "document", "text");

        // Act
        await repository.AddAsync(requirement, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(requirement.Id, CancellationToken.None);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateRequirement()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement = new Requirement("REQ001", "Test Requirement", "Test Description", "document", "text");
        context.Set<Requirement>().Add(requirement);
        await context.SaveChangesAsync();

        // Act
        requirement.UpdateDetails("Updated Requirement", "Updated Description", "document", "text");
        await repository.UpdateAsync(requirement, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(requirement.Id, CancellationToken.None);
        Assert.NotNull(result);
        Assert.Equal("Updated Requirement", result.DisplayName);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteRequirement()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement = new Requirement("REQ001", "Test Requirement", "Test Description", "document", "text");
        context.Set<Requirement>().Add(requirement);
        await context.SaveChangesAsync();

        // Act
        await repository.DeleteAsync(requirement, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(requirement.Id, CancellationToken.None);
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_ById_ShouldDeleteRequirement()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new EntityConfigurationDbContext(options);
        var repository = new RequirementRepository(context, _logger);

        var requirement = new Requirement("REQ001", "Test Requirement", "Test Description", "document", "text");
        context.Set<Requirement>().Add(requirement);
        await context.SaveChangesAsync();

        // Act
        await repository.DeleteAsync(requirement.Id, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(requirement.Id, CancellationToken.None);
        Assert.Null(result);
    }
}

