using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;
using OnboardingApi.Tests.Unit.TestHelpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class WizardConfigurationRepositoryTests : IDisposable
{
    private readonly EntityConfigurationDbContext _context;
    private readonly WizardConfigurationRepository _repository;
    private readonly MockLogger<WizardConfigurationRepository> _logger;

    public WizardConfigurationRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<EntityConfigurationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _logger = new MockLogger<WizardConfigurationRepository>();
        _context = new EntityConfigurationDbContext(options);
        _repository = new WizardConfigurationRepository(_context, _logger);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnConfiguration_WhenExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var config = new WizardConfiguration(entityTypeId);

        await _context.WizardConfigurations.AddAsync(config);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(config.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(config.Id, result!.Id);
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
    public async Task GetByEntityTypeIdAsync_ShouldReturnConfiguration_WhenExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var config = new WizardConfiguration(entityTypeId);

        await _context.WizardConfigurations.AddAsync(config);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByEntityTypeIdAsync(entityTypeId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(entityTypeId, result!.EntityTypeId);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnActiveConfigurations_WhenIncludeInactiveIsFalse()
    {
        // Arrange
        var config1 = new WizardConfiguration(Guid.NewGuid());
        var config2 = new WizardConfiguration(Guid.NewGuid());
        config2.Deactivate();

        await _context.WizardConfigurations.AddRangeAsync(config1, config2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync(includeInactive: false);

        // Assert
        Assert.Single(result);
        Assert.True(result[0].IsActive);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllConfigurations_WhenIncludeInactiveIsTrue()
    {
        // Arrange
        var config1 = new WizardConfiguration(Guid.NewGuid());
        var config2 = new WizardConfiguration(Guid.NewGuid());
        config2.Deactivate();

        await _context.WizardConfigurations.AddRangeAsync(config1, config2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync(includeInactive: true);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task AddAsync_ShouldAddConfiguration()
    {
        // Arrange
        var config = new WizardConfiguration(Guid.NewGuid());

        // Act
        await _repository.AddAsync(config);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _context.WizardConfigurations.FindAsync(config.Id);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteConfiguration_WhenIdProvided()
    {
        // Arrange
        var config = new WizardConfiguration(Guid.NewGuid());
        await _context.WizardConfigurations.AddAsync(config);
        await _context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(config.Id);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _context.WizardConfigurations.FindAsync(config.Id);
        Assert.Null(result);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

