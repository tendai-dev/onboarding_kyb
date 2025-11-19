using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Retry;
using Polly.Timeout;
using System.Diagnostics.Metrics;

namespace WorkQueueService.Infrastructure.Resilience;

/// <summary>
/// Centralized resilience policies using Polly for HTTP service calls
/// Implements retry, circuit breaker, and timeout patterns
/// </summary>
public static class ResiliencePolicies
{
    private static readonly Meter Meter = new("WorkQueueService.Resilience", "1.0");
    private static readonly Counter<long> CircuitBreakerOpenCounter = Meter.CreateCounter<long>("circuit_breaker_open_total");
    private static readonly Counter<long> RetryCounter = Meter.CreateCounter<long>("retry_count_total");

    /// <summary>
    /// Retry policy with exponential backoff for HTTP calls
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetHttpRetryPolicy(
        string serviceName,
        ILogger logger,
        int maxRetryAttempts = 3)
    {
        var jitterer = new Random();

        return Policy
            .HandleResult<HttpResponseMessage>(r =>
                (int)r.StatusCode >= 500 ||
                r.StatusCode == System.Net.HttpStatusCode.RequestTimeout ||
                r.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            .Or<HttpRequestException>()
            .Or<TaskCanceledException>()
            .Or<TimeoutRejectedException>()
            .WaitAndRetryAsync(
                retryCount: maxRetryAttempts,
                sleepDurationProvider: attempt =>
                {
                    var baseDelay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    var jitter = TimeSpan.FromMilliseconds(jitterer.Next(0, 1000));
                    return baseDelay + jitter;
                },
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    RetryCounter.Add(1, new KeyValuePair<string, object?>("service", serviceName));
                    logger.LogWarning(
                        "Retry {RetryCount}/{MaxRetries} for {ServiceName} after {Delay}ms",
                        retryCount,
                        maxRetryAttempts,
                        serviceName,
                        timespan.TotalMilliseconds);
                });
    }

    /// <summary>
    /// Circuit breaker policy
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy(
        string serviceName,
        ILogger logger,
        int failureThreshold = 5,
        TimeSpan durationOfBreak = default)
    {
        if (durationOfBreak == default)
            durationOfBreak = TimeSpan.FromSeconds(30);

        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .Or<TimeoutRejectedException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: failureThreshold,
                durationOfBreak: durationOfBreak,
                onBreak: (outcome, duration) =>
                {
                    CircuitBreakerOpenCounter.Add(1, new KeyValuePair<string, object?>("service", serviceName));
                    logger.LogError("Circuit breaker opened for {ServiceName} for {Duration}s", serviceName, duration.TotalSeconds);
                },
                onReset: () => logger.LogInformation("Circuit breaker reset for {ServiceName}", serviceName),
                onHalfOpen: () => logger.LogInformation("Circuit breaker half-open for {ServiceName}", serviceName));
    }

    /// <summary>
    /// Timeout policy
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy(
        string serviceName,
        ILogger logger,
        TimeSpan timeout = default)
    {
        if (timeout == default)
            timeout = TimeSpan.FromMinutes(5); // Longer timeout for sync operations

        return Policy
            .TimeoutAsync<HttpResponseMessage>(
                timeout,
                TimeoutStrategy.Optimistic,
                onTimeoutAsync: (context, timespan, task) =>
                {
                    logger.LogWarning("Timeout after {Timeout}s for {ServiceName}", timespan.TotalSeconds, serviceName);
                    return Task.CompletedTask;
                });
    }

    /// <summary>
    /// Combined policy for HTTP calls
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetCombinedHttpPolicy(
        string serviceName,
        ILogger logger,
        TimeSpan? timeout = null)
    {
        var timeoutPolicy = GetTimeoutPolicy(serviceName, logger, timeout ?? TimeSpan.FromMinutes(5));
        var retryPolicy = GetHttpRetryPolicy(serviceName, logger, 3);
        var circuitBreakerPolicy = GetCircuitBreakerPolicy(serviceName, logger, 5, TimeSpan.FromSeconds(30));

        return Policy.WrapAsync(circuitBreakerPolicy, retryPolicy, timeoutPolicy);
    }
}

