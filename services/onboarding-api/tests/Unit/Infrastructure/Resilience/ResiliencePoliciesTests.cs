using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Resilience;
using OnboardingApi.Tests.Unit.TestHelpers;
using Polly;
using Polly.CircuitBreaker;
using System.Net;
using System.Net.Http;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Resilience;

public class ResiliencePoliciesTests
{
    private readonly MockLogger<object> _logger;

    public ResiliencePoliciesTests()
    {
        _logger = new MockLogger<object>();
    }

    [Fact]
    public void GetCircuitBreakerPolicy_ShouldCreatePolicy_WithDefaultSettings()
    {
        // Act
        var policy = ResiliencePolicies.GetCircuitBreakerPolicy("TestService", _logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetCircuitBreakerPolicy_ShouldCreatePolicy_WithCustomSettings()
    {
        // Act
        var policy = ResiliencePolicies.GetCircuitBreakerPolicy(
            "TestService",
            _logger,
            failureThreshold: 3,
            durationOfBreak: TimeSpan.FromSeconds(60));

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetRetryPolicy_ShouldCreatePolicy_WithDefaultSettings()
    {
        // Act
        var policy = ResiliencePolicies.GetRetryPolicy("TestService", _logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetRetryPolicy_ShouldCreatePolicy_WithCustomRetryCount()
    {
        // Act
        var policy = ResiliencePolicies.GetRetryPolicy("TestService", _logger, maxRetryAttempts: 5);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetTimeoutPolicy_ShouldCreatePolicy_WithDefaultTimeout()
    {
        // Act
        var policy = ResiliencePolicies.GetTimeoutPolicy("TestService", _logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetTimeoutPolicy_ShouldCreatePolicy_WithCustomTimeout()
    {
        // Act
        var policy = ResiliencePolicies.GetTimeoutPolicy(
            "TestService",
            _logger,
            timeout: TimeSpan.FromSeconds(30));

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetBulkheadPolicy_ShouldCreatePolicy_WithDefaultSettings()
    {
        // Act
        var policy = ResiliencePolicies.GetBulkheadPolicy("TestService", _logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetBulkheadPolicy_ShouldCreatePolicy_WithCustomSettings()
    {
        // Act
        var policy = ResiliencePolicies.GetBulkheadPolicy(
            "TestService",
            _logger,
            maxParallelization: 5,
            maxQueuingActions: 10);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetFallbackPolicy_ShouldCreatePolicy()
    {
        // Arrange
        var fallbackResponse = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);

        // Act
        var policy = ResiliencePolicies.GetFallbackPolicy(
            "TestService",
            _logger,
            () => fallbackResponse);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetCombinedPolicy_ShouldCreatePolicy_WithDefaultOptions()
    {
        // Act
        var policy = ResiliencePolicies.GetCombinedPolicy("TestService", _logger);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetCombinedPolicy_ShouldCreatePolicy_WithCustomOptions()
    {
        // Arrange
        var options = new ResilienceOptions
        {
            MaxRetryAttempts = 5,
            CircuitBreakerThreshold = 3,
            CircuitBreakerDuration = TimeSpan.FromSeconds(60),
            Timeout = TimeSpan.FromSeconds(30),
            MaxParallelization = 5
        };

        // Act
        var policy = ResiliencePolicies.GetCombinedPolicy("TestService", _logger, options);

        // Assert
        Assert.NotNull(policy);
    }
}

