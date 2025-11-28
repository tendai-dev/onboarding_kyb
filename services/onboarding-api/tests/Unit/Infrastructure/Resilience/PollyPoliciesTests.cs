using OnboardingApi.Infrastructure.Resilience;
using System.Net;
using System.Net.Http;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Resilience;

public class PollyPoliciesTests
{
    [Fact]
    public void GetHttpRetryPolicy_ShouldCreatePolicy()
    {
        // Act
        var policy = PollyPolicies.GetHttpRetryPolicy();

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetHttpCircuitBreakerPolicy_ShouldCreatePolicy()
    {
        // Act
        var policy = PollyPolicies.GetHttpCircuitBreakerPolicy();

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetHttpTimeoutPolicy_ShouldCreatePolicy_WithDefaultTimeout()
    {
        // Act
        var policy = PollyPolicies.GetHttpTimeoutPolicy();

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetHttpTimeoutPolicy_ShouldCreatePolicy_WithCustomTimeout()
    {
        // Act
        var policy = PollyPolicies.GetHttpTimeoutPolicy(60);

        // Assert
        Assert.NotNull(policy);
    }

    [Fact]
    public void GetCombinedHttpPolicy_ShouldCreatePolicy()
    {
        // Act
        var policy = PollyPolicies.GetCombinedHttpPolicy();

        // Assert
        Assert.NotNull(policy);
    }
}

