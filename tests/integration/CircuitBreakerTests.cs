using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using OnboardingApi.Infrastructure.Resilience;
using Polly.CircuitBreaker;
using Xunit;

namespace OnboardingApi.Tests.Integration;

/// <summary>
/// Integration tests for circuit breaker and resilience policies
/// </summary>
public class CircuitBreakerTests
{
    private readonly Mock<ILogger> _mockLogger;
    
    public CircuitBreakerTests()
    {
        _mockLogger = new Mock<ILogger>();
    }
    
    [Fact]
    public async Task CircuitBreaker_OpensAfter5ConsecutiveFailures()
    {
        // Arrange
        var policy = ResiliencePolicies.GetCircuitBreakerPolicy(
            "test-service",
            _mockLogger.Object,
            failureThreshold: 5,
            durationOfBreak: TimeSpan.FromSeconds(1));
        
        var failureCount = 0;
        
        // Act & Assert
        // First 5 failures should execute
        for (int i = 0; i < 5; i++)
        {
            await Assert.ThrowsAsync<HttpRequestException>(async () =>
            {
                await policy.ExecuteAsync(async () =>
                {
                    failureCount++;
                    await Task.CompletedTask;
                    throw new HttpRequestException("Simulated failure");
                });
            });
        }
        
        Assert.Equal(5, failureCount);
        
        // 6th attempt should fail immediately with BrokenCircuitException
        await Assert.ThrowsAsync<BrokenCircuitException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                failureCount++;
                await Task.CompletedTask;
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
        });
        
        // Circuit is open, so failureCount should still be 5
        Assert.Equal(5, failureCount);
    }
    
    [Fact]
    public async Task CircuitBreaker_ResetsAfterDurationOfBreak()
    {
        // Arrange
        var policy = ResiliencePolicies.GetCircuitBreakerPolicy(
            "test-service",
            _mockLogger.Object,
            failureThreshold: 3,
            durationOfBreak: TimeSpan.FromMilliseconds(500));
        
        // Act
        // Trigger 3 failures to open circuit
        for (int i = 0; i < 3; i++)
        {
            await Assert.ThrowsAsync<HttpRequestException>(async () =>
            {
                await policy.ExecuteAsync<HttpResponseMessage>(async () =>
                {
                    await Task.CompletedTask;
                    throw new HttpRequestException("Simulated failure");
                });
            });
        }
        
        // Circuit should be open
        await Assert.ThrowsAsync<BrokenCircuitException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                await Task.CompletedTask;
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
        });
        
        // Wait for circuit to reset
        await Task.Delay(TimeSpan.FromMilliseconds(600));
        
        // Circuit should be half-open, allowing one test request
        var result = await policy.ExecuteAsync(async () =>
        {
            await Task.CompletedTask;
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
    }
    
    [Fact]
    public async Task RetryPolicy_RetriesWithExponentialBackoff()
    {
        // Arrange
        var policy = ResiliencePolicies.GetRetryPolicy(
            "test-service",
            _mockLogger.Object,
            maxRetryAttempts: 3);
        
        var attemptCount = 0;
        var attemptTimestamps = new List<DateTime>();
        
        // Act
        await Assert.ThrowsAsync<HttpRequestException>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                attemptCount++;
                attemptTimestamps.Add(DateTime.UtcNow);
                await Task.CompletedTask;
                throw new HttpRequestException("Simulated failure");
            });
        });
        
        // Assert
        Assert.Equal(4, attemptCount); // Initial attempt + 3 retries
        Assert.Equal(4, attemptTimestamps.Count);
        
        // Verify exponential backoff (approximately)
        // First retry should be ~2 seconds after initial
        var firstRetryDelay = (attemptTimestamps[1] - attemptTimestamps[0]).TotalSeconds;
        Assert.InRange(firstRetryDelay, 1.5, 3.5); // 2s ± jitter
        
        // Second retry should be ~4 seconds after first retry
        var secondRetryDelay = (attemptTimestamps[2] - attemptTimestamps[1]).TotalSeconds;
        Assert.InRange(secondRetryDelay, 3.5, 5.5); // 4s ± jitter
    }
    
    [Fact]
    public async Task RetryPolicy_SucceedsOnSecondAttempt()
    {
        // Arrange
        var policy = ResiliencePolicies.GetRetryPolicy(
            "test-service",
            _mockLogger.Object,
            maxRetryAttempts: 3);
        
        var attemptCount = 0;
        
        // Act
        var result = await policy.ExecuteAsync(async () =>
        {
            attemptCount++;
            await Task.CompletedTask;
            
            if (attemptCount == 1)
                throw new HttpRequestException("First attempt fails");
            
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        
        // Assert
        Assert.Equal(2, attemptCount); // Initial + 1 retry
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
    }
    
    [Fact]
    public async Task TimeoutPolicy_ThrowsAfterTimeout()
    {
        // Arrange
        var policy = ResiliencePolicies.GetTimeoutPolicy(
            "test-service",
            _mockLogger.Object,
            timeout: TimeSpan.FromMilliseconds(500));
        
        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(async () =>
        {
            await policy.ExecuteAsync(async () =>
            {
                // Simulate long-running operation
                await Task.Delay(TimeSpan.FromSeconds(2));
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
        });
    }
    
    [Fact]
    public async Task BulkheadPolicy_LimitsParallelExecution()
    {
        // Arrange
        var policy = ResiliencePolicies.GetBulkheadPolicy(
            "test-service",
            _mockLogger.Object,
            maxParallelization: 2,
            maxQueuingActions: 0);
        
        var concurrentExecutions = 0;
        var maxConcurrentExecutions = 0;
        
        // Act
        var tasks = new List<Task>();
        for (int i = 0; i < 5; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                try
                {
                    await policy.ExecuteAsync(async () =>
                    {
                        Interlocked.Increment(ref concurrentExecutions);
                        maxConcurrentExecutions = Math.Max(maxConcurrentExecutions, concurrentExecutions);
                        
                        await Task.Delay(100); // Simulate work
                        
                        Interlocked.Decrement(ref concurrentExecutions);
                        return new HttpResponseMessage(HttpStatusCode.OK);
                    });
                }
                catch
                {
                    // Some will be rejected due to bulkhead
                }
            }));
        }
        
        await Task.WhenAll(tasks);
        
        // Assert
        Assert.True(maxConcurrentExecutions <= 2, 
            $"Expected max 2 concurrent executions, but got {maxConcurrentExecutions}");
    }
    
    [Fact]
    public async Task FallbackPolicy_ReturnsFallbackResponseOnFailure()
    {
        // Arrange
        var fallbackResponse = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
        {
            Content = new StringContent("Service temporarily unavailable")
        };
        
        var policy = ResiliencePolicies.GetFallbackPolicy(
            "test-service",
            _mockLogger.Object,
            () => fallbackResponse);
        
        // Act
        var result = await policy.ExecuteAsync<HttpResponseMessage>(async () =>
        {
            await Task.CompletedTask;
            throw new HttpRequestException("Service failure");
        });
        
        // Assert
        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        var content = await result.Content.ReadAsStringAsync();
        Assert.Equal("Service temporarily unavailable", content);
    }
    
    [Fact]
    public async Task CombinedPolicy_IntegratesAllPolicies()
    {
        // Arrange
        var options = new ResilienceOptions
        {
            MaxRetryAttempts = 2,
            Timeout = TimeSpan.FromSeconds(1),
            CircuitBreakerThreshold = 3,
            CircuitBreakerDuration = TimeSpan.FromSeconds(1),
            MaxParallelization = 5
        };
        
        var policy = ResiliencePolicies.GetCombinedPolicy(
            "test-service",
            _mockLogger.Object,
            options);
        
        var attemptCount = 0;
        
        // Act
        var result = await policy.ExecuteAsync(async () =>
        {
            attemptCount++;
            await Task.CompletedTask;
            
            if (attemptCount <= 1)
                throw new HttpRequestException("Transient failure");
            
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        
        // Assert
        Assert.Equal(2, attemptCount); // Initial + 1 retry
        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
    }
    
    [Fact]
    public async Task DatabasePolicy_RetriesTransientErrors()
    {
        // Arrange
        var policy = ResiliencePolicies.GetDatabasePolicy(_mockLogger.Object);
        
        var attemptCount = 0;
        
        // Act
        await policy.ExecuteAsync(async () =>
        {
            attemptCount++;
            await Task.CompletedTask;
            
            if (attemptCount <= 2)
                throw new Exception("Connection timeout");
            
            // Success on 3rd attempt
        });
        
        // Assert
        Assert.Equal(3, attemptCount);
    }
    
    [Fact]
    public async Task RedisPolicy_FallsBackGracefullyOnFailure()
    {
        // Arrange
        var policy = ResiliencePolicies.GetRedisPolicy(_mockLogger.Object);
        
        var operationExecuted = false;
        
        // Act
        await policy.ExecuteAsync(async () =>
        {
            operationExecuted = true;
            await Task.CompletedTask;
            throw new Exception("Redis connection failed");
        });
        
        // Assert
        Assert.True(operationExecuted);
        // No exception thrown - fallback handled it
    }
}

