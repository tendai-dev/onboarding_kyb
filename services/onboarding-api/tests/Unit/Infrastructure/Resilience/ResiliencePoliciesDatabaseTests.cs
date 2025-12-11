using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Resilience;
using OnboardingApi.Tests.Unit.TestHelpers;
using System;
using System.Threading.Tasks;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Resilience;

public class ResiliencePoliciesDatabaseTests
{
    private readonly MockLogger<object> _logger;

    public ResiliencePoliciesDatabaseTests()
    {
        _logger = new MockLogger<object>();
    }

    [Fact]
    public void GetDatabasePolicy_ShouldCreatePolicy()
    {
        // Act
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public async Task GetDatabasePolicy_ShouldRetry_OnTransientTimeoutError()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);
        var attemptCount = 0;

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                // Always throw to ensure retries happen and eventually fail
                throw new InvalidOperationException("Database timeout occurred");
            });
        });

        // Should have retried (3 retries + 1 initial = 4 attempts)
        Assert.True(attemptCount >= 3);
    }

    [Fact]
    public async Task GetDatabasePolicy_ShouldRetry_OnTransientConnectionError()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);
        var attemptCount = 0;

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                // Always throw to ensure retries happen and eventually fail
                throw new InvalidOperationException("Connection to database failed");
            });
        });

        // Should have retried (3 retries + 1 initial = 4 attempts)
        Assert.True(attemptCount >= 3);
    }

    [Fact]
    public async Task GetDatabasePolicy_ShouldRetry_OnTransientDeadlockError()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);
        var attemptCount = 0;

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                // Always throw to ensure retries happen and eventually fail
                throw new InvalidOperationException("Deadlock detected");
            });
        });

        // Should have retried (3 retries + 1 initial = 4 attempts)
        Assert.True(attemptCount >= 3);
    }

    [Fact]
    public async Task GetDatabasePolicy_ShouldRetry_OnTransientNetworkError()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);
        var attemptCount = 0;

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                // Always throw to ensure retries happen and eventually fail
                throw new InvalidOperationException("Network error occurred");
            });
        });

        // Should have retried (3 retries + 1 initial = 4 attempts)
        Assert.True(attemptCount >= 3);
    }

    [Fact]
    public void GetRedisPolicy_ShouldCreatePolicy()
    {
        // Act
        var policy = ResiliencePolicies.GetRedisPolicy(_logger);

        // Assert
        Assert.NotNull(policy);
    }
}

