using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class OrganizationMapperTests
{
    private readonly MockLogger<OrganizationMapper> _logger;
    private readonly MockDistributedCache _cache;
    private readonly OnboardingDbContext _context;

    public OrganizationMapperTests()
    {
        _logger = new MockLogger<OrganizationMapper>();
        _cache = new MockDistributedCache();
        
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new TestOnboardingDbContext(options);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnFromCache_WhenCached()
    {
        // Arrange
        var email = "test@example.com";
        var organizationId = "org123";
        _cache.SetString($"org_mapping:{email.ToLowerInvariant()}", organizationId);

        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.GetOrganizationIdAsync(email);

        // Assert
        Assert.Equal(organizationId, result);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnFromDatabase_WhenNotCached()
    {
        // Arrange
        var email = "test@example.com";
        var organizationId = "org123";
        
        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Set<UserOrganizationMapping>().Add(mapping);
        await _context.SaveChangesAsync();

        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.GetOrganizationIdAsync(email);

        // Assert
        Assert.Equal(organizationId, result);
        // Verify it was cached
        var cached = await _cache.GetStringAsync($"org_mapping:{email.ToLowerInvariant()}");
        Assert.Equal(organizationId, cached);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnNull_WhenNotFound()
    {
        // Arrange
        var email = "notfound@example.com";
        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.GetOrganizationIdAsync(email);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnNull_WhenEmailIsEmpty()
    {
        // Arrange
        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.GetOrganizationIdAsync("");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOrganizationAsync_ShouldReturnOrganization_WhenFound()
    {
        // Arrange
        var email = "test@example.com";
        var organizationId = "org123";
        
        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Set<UserOrganizationMapping>().Add(mapping);

        var organization = new Organization
        {
            OrganizationId = organizationId,
            Name = "Test Org",
            Country = "US",
            BusinessType = "Corporation",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Set<Organization>().Add(organization);
        await _context.SaveChangesAsync();

        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.GetOrganizationAsync(email);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(organizationId, result.OrganizationId);
        Assert.Equal("Test Org", result.OrganizationName);
        Assert.Equal("US", result.Country);
    }

    [Fact]
    public async Task GetOrganizationAsync_ShouldReturnNull_WhenMappingNotFound()
    {
        // Arrange
        var email = "notfound@example.com";
        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.GetOrganizationAsync(email);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldCreateMapping_WhenNotExists()
    {
        // Arrange
        var email = "newuser@example.com";
        var organizationId = "org456";
        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        await service.MapUserToOrganizationAsync(email, organizationId);

        // Assert
        var mapping = await _context.Set<UserOrganizationMapping>()
            .FirstOrDefaultAsync(m => m.UserEmail == email.ToLowerInvariant());
        Assert.NotNull(mapping);
        Assert.Equal(organizationId, mapping.OrganizationId);
        
        // Verify cache was invalidated
        var cached = await _cache.GetStringAsync($"org_mapping:{email.ToLowerInvariant()}");
        Assert.Null(cached);
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldUpdateMapping_WhenExists()
    {
        // Arrange
        var email = "existing@example.com";
        var oldOrgId = "org123";
        var newOrgId = "org456";
        
        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = oldOrgId,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.Set<UserOrganizationMapping>().Add(mapping);
        await _context.SaveChangesAsync();

        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        await service.MapUserToOrganizationAsync(email, newOrgId);

        // Assert
        var updatedMapping = await _context.Set<UserOrganizationMapping>()
            .FirstOrDefaultAsync(m => m.UserEmail == email.ToLowerInvariant());
        Assert.NotNull(updatedMapping);
        Assert.Equal(newOrgId, updatedMapping.OrganizationId);
        // UpdatedAt should be greater than or equal to the original (allowing for same millisecond)
        Assert.True(updatedMapping.UpdatedAt >= mapping.UpdatedAt);
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldThrow_WhenEmailIsEmpty()
    {
        // Arrange
        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            service.MapUserToOrganizationAsync("", "org123"));
    }

    [Fact]
    public async Task MapUserToOrganizationAsync_ShouldThrow_WhenOrganizationIdIsEmpty()
    {
        // Arrange
        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            service.MapUserToOrganizationAsync("test@example.com", ""));
    }

    [Fact]
    public async Task BelongsToOrganizationAsync_ShouldReturnTrue_WhenUserBelongsToOrganization()
    {
        // Arrange
        var email = "test@example.com";
        var organizationId = "org123";
        
        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Set<UserOrganizationMapping>().Add(mapping);
        await _context.SaveChangesAsync();

        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.BelongsToOrganizationAsync(email, organizationId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task BelongsToOrganizationAsync_ShouldReturnFalse_WhenUserDoesNotBelong()
    {
        // Arrange
        var email = "test@example.com";
        var organizationId = "org123";
        var otherOrgId = "org456";
        
        var mapping = new UserOrganizationMapping
        {
            UserEmail = email.ToLowerInvariant(),
            OrganizationId = organizationId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Set<UserOrganizationMapping>().Add(mapping);
        await _context.SaveChangesAsync();

        var service = new OrganizationMapper(_context, _cache, _logger);

        // Act
        var result = await service.BelongsToOrganizationAsync(email, otherOrgId);

        // Assert
        Assert.False(result);
    }
}

public class MockDistributedCache : IDistributedCache
{
    private readonly Dictionary<string, string> _cache = new();

    public byte[]? Get(string key)
    {
        return _cache.TryGetValue(key, out var value) ? System.Text.Encoding.UTF8.GetBytes(value) : null;
    }

    public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
    {
        return Task.FromResult(Get(key));
    }

    public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
    {
        _cache[key] = System.Text.Encoding.UTF8.GetString(value);
    }

    public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        Set(key, value, options);
        return Task.CompletedTask;
    }

    public void Refresh(string key)
    {
        // No-op
    }

    public Task RefreshAsync(string key, CancellationToken token = default)
    {
        return Task.CompletedTask;
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
    }

    public Task RemoveAsync(string key, CancellationToken token = default)
    {
        Remove(key);
        return Task.CompletedTask;
    }

    public void SetString(string key, string value)
    {
        _cache[key] = value;
    }

    public async Task<string?> GetStringAsync(string key)
    {
        var bytes = await GetAsync(key);
        return bytes != null ? System.Text.Encoding.UTF8.GetString(bytes) : null;
    }
}

public class TestOnboardingDbContext : OnboardingDbContext
{
    public TestOnboardingDbContext(DbContextOptions<OnboardingDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Register entities used by OrganizationMapper
        modelBuilder.Entity<UserOrganizationMapping>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserEmail).IsRequired();
            entity.Property(e => e.OrganizationId).IsRequired();
        });

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(e => e.OrganizationId);
            entity.Property(e => e.Name).IsRequired();
        });
    }
}

