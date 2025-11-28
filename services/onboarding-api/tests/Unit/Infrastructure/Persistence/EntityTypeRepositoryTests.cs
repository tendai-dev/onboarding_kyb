using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;
using OnboardingApi.Tests.Unit.TestHelpers;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class EntityTypeRepositoryTests : IDisposable
{
    private readonly EntityConfigurationDbContext _context;
    private readonly EntityTypeRepository _repository;
    private readonly MockLogger<EntityTypeRepository> _logger;

    public EntityTypeRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _logger = new MockLogger<EntityTypeRepository>();
        _context = new EntityConfigurationDbContext(options);
        _repository = new EntityTypeRepository(_context, _logger);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnEntityType_WhenExists()
    {
        // Arrange
        var entityType = new EntityType("TEST", "Test Entity", "Test Description");

        await _context.EntityTypes.AddAsync(entityType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(entityType.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entityType.Id, result!.Id);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByCodeAsync_ShouldReturnEntityType_WhenExists()
    {
        // Arrange
        var entityType = new EntityType("TEST", "Test Entity", "Test Description");

        await _context.EntityTypes.AddAsync(entityType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByCodeAsync("TEST");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("TEST", result!.Code);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnActiveEntityTypes_WhenIncludeInactiveIsFalse()
    {
        // Arrange
        var entityType1 = new EntityType("TEST1", "Test Entity 1", "Description 1");
        var entityType2 = new EntityType("TEST2", "Test Entity 2", "Description 2");
        entityType2.Deactivate();

        await _context.EntityTypes.AddRangeAsync(entityType1, entityType2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync(includeInactive: false);

        // Assert
        Assert.Single(result);
        Assert.True(result[0].IsActive);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllEntityTypes_WhenIncludeInactiveIsTrue()
    {
        // Arrange
        var entityType1 = new EntityType("TEST1", "Test Entity 1", "Description 1");
        var entityType2 = new EntityType("TEST2", "Test Entity 2", "Description 2");
        entityType2.Deactivate();

        await _context.EntityTypes.AddRangeAsync(entityType1, entityType2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync(includeInactive: true);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllWithRequirementsAsync_ShouldReturnEntityTypes_WithRequirements()
    {
        // Arrange
        var entityType = new EntityType("TEST", "Test Entity", "Test Description");

        await _context.EntityTypes.AddAsync(entityType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllWithRequirementsAsync();

        // Assert
        Assert.Single(result);
        Assert.Equal("TEST", result[0].Code);
    }

    [Fact]
    public async Task AddAsync_ShouldAddEntityType()
    {
        // Arrange
        var entityType = new EntityType("TEST", "Test Entity", "Test Description");

        // Act
        await _repository.AddAsync(entityType);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _context.EntityTypes.FindAsync(entityType.Id);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteEntityType_WhenIdProvided()
    {
        // Arrange
        var entityType = new EntityType("TEST", "Test Entity", "Test Description");
        await _context.EntityTypes.AddAsync(entityType);
        await _context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(entityType.Id);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _context.EntityTypes.FindAsync(entityType.Id);
        Assert.Null(result);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

