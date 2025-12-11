using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class OrganizationMapperEdgeCaseTests
{
    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnNull_WhenEmailIsEmpty()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        // Act
        var result = await mapper.GetOrganizationIdAsync("");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnNull_WhenEmailIsNull()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        // Act
        var result = await mapper.GetOrganizationIdAsync(null!);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldNormalizeEmail()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        var email = "Test@Example.COM";
        var normalizedEmail = email.ToLowerInvariant();
        var orgId = "ORG-123";

        var mapping = new UserOrganizationMapping
        {
            UserEmail = normalizedEmail,
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Set<UserOrganizationMapping>().Add(mapping);
        await context.SaveChangesAsync();

        // Act
        var result = await mapper.GetOrganizationIdAsync(email);

        // Assert
        Assert.Equal(orgId, result);
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldThrow_WhenEmailIsEmpty()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            mapper.MapUserToOrganizationAsync("", "ORG-123"));
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldThrow_WhenOrganizationIdIsEmpty()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            mapper.MapUserToOrganizationAsync("test@example.com", ""));
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldUpdateExistingMapping()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        var email = "test@example.com";
        var normalizedEmail = email.ToLowerInvariant();
        var oldOrgId = "ORG-OLD";
        var newOrgId = "ORG-NEW";

        var mapping = new UserOrganizationMapping
        {
            UserEmail = normalizedEmail,
            OrganizationId = oldOrgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Set<UserOrganizationMapping>().Add(mapping);
        await context.SaveChangesAsync();

        // Act
        await mapper.MapUserToOrganizationAsync(email, newOrgId);

        // Assert
        var updated = await context.Set<UserOrganizationMapping>()
            .FirstOrDefaultAsync(m => m.UserEmail == normalizedEmail);
        Assert.NotNull(updated);
        Assert.Equal(newOrgId, updated.OrganizationId);
    }

    [Fact]
    public async Task BelongsToOrganizationAsync_ShouldReturnTrue_WhenUserBelongsToOrg()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        var email = "test@example.com";
        var orgId = "ORG-123";

        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Set<UserOrganizationMapping>().Add(mapping);
        await context.SaveChangesAsync();

        // Act
        var result = await mapper.BelongsToOrganizationAsync(email, orgId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task BelongsToOrganizationAsync_ShouldReturnFalse_WhenUserDoesNotBelongToOrg()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        var email = "test@example.com";
        var orgId = "ORG-123";
        var otherOrgId = "ORG-456";

        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Set<UserOrganizationMapping>().Add(mapping);
        await context.SaveChangesAsync();

        // Act
        var result = await mapper.BelongsToOrganizationAsync(email, otherOrgId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetOrganizationAsync_ShouldReturnNull_WhenOrganizationNotFound()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        var email = "test@example.com";
        var orgId = "ORG-123";

        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Set<UserOrganizationMapping>().Add(mapping);
        await context.SaveChangesAsync();

        // Act - Organization entity doesn't exist
        var result = await mapper.GetOrganizationAsync(email);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOrganizationAsync_ShouldReturnOrganizationInfo_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new TestOnboardingDbContext(options);
        var cache = new MockDistributedCache();
        var logger = new MockLogger<OrganizationMapper>();
        var mapper = new OrganizationMapper(context, cache, logger);

        var email = "test@example.com";
        var orgId = "ORG-123";

        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var organization = new Organization
        {
            OrganizationId = orgId,
            Name = "Test Org",
            Country = "US",
            BusinessType = "Corporation",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        context.Set<UserOrganizationMapping>().Add(mapping);
        context.Set<Organization>().Add(organization);
        await context.SaveChangesAsync();

        // Act
        var result = await mapper.GetOrganizationAsync(email);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(orgId, result.OrganizationId);
        Assert.Equal("Test Org", result.OrganizationName);
        Assert.Equal("US", result.Country);
        Assert.Equal("Corporation", result.BusinessType);
        Assert.True(result.IsActive);
    }
}

