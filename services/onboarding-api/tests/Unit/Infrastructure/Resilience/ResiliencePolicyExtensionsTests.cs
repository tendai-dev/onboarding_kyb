using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Resilience;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Resilience;

public class ResiliencePolicyExtensionsTests
{
    private readonly MockLogger<object> _logger;

    public ResiliencePolicyExtensionsTests()
    {
        _logger = new MockLogger<object>();
    }

    [Fact]
    public void AddResiliencePolicies_ShouldReturnBuilder_WithDefaultOptions()
    {
        // Arrange
        var services = new ServiceCollection();
        var builder = services.AddHttpClient("TestClient");

        // Act
        var result = builder.AddResiliencePolicies("TestService", _logger);

        // Assert
        Assert.NotNull(result);
        Assert.Same(builder, result);
    }

    [Fact]
    public void AddResiliencePolicies_ShouldReturnBuilder_WithCustomOptions()
    {
        // Arrange
        var services = new ServiceCollection();
        var builder = services.AddHttpClient("TestClient");
        var options = new ResilienceOptions
        {
            MaxRetryAttempts = 5,
            CircuitBreakerThreshold = 3,
            CircuitBreakerDuration = TimeSpan.FromSeconds(60),
            Timeout = TimeSpan.FromSeconds(30),
            MaxParallelization = 5
        };

        // Act
        var result = builder.AddResiliencePolicies("TestService", _logger, options);

        // Assert
        Assert.NotNull(result);
        Assert.Same(builder, result);
    }
}

