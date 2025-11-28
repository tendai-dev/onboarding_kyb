using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Resilience;
using OnboardingApi.Tests.Unit.TestHelpers;
using Polly;
using System;
using System.Threading.Tasks;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Resilience;

public class ResiliencePoliciesMoreTests
{
    private readonly MockLogger<object> _logger;

    public ResiliencePoliciesMoreTests()
    {
        _logger = new MockLogger<object>();
    }

    [Fact]
    public void GetRedisPolicy_ShouldCreatePolicy()
    {
        // Act
        var policy = ResiliencePolicies.GetRedisPolicy(_logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public async Task GetRedisPolicy_ShouldExecuteFallback_WhenExceptionOccurs()
    {
        // Arrange
        var policy = ResiliencePolicies.GetRedisPolicy(_logger);

        // Act
        await policy.ExecuteAsync(async () =>
        {
            await Task.CompletedTask;
            throw new InvalidOperationException("Redis error");
        });

        // Assert
        // Should complete without throwing (fallback executed)
        Assert.True(true);
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
    public async Task GetDatabasePolicy_ShouldRetry_OnTransientError()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);
        var attemptCount = 0;

        // Act
        try
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                if (attemptCount < 2)
                {
                    throw new InvalidOperationException("Connection timeout");
                }
                await Task.CompletedTask;
            });
        }
        catch
        {
            // Expected to fail after retries
        }

        // Assert
        Assert.True(attemptCount > 1); // Should have retried
    }

    [Fact]
    public async Task GetDatabasePolicy_ShouldNotRetry_OnNonTransientError()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_logger);
        var attemptCount = 0;

        // Act
        try
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                throw new InvalidOperationException("Invalid query syntax");
            });
        }
        catch
        {
            // Expected to fail
        }

        // Assert
        Assert.Equal(1, attemptCount); // Should not retry non-transient errors
    }
}

