using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Retry;
using Polly.Timeout;
using System.Diagnostics.Metrics;

namespace EntityConfigurationService.Infrastructure.Resilience;

/// <summary>
/// Centralized resilience policies using Polly for external service calls
/// Implements retry, circuit breaker, timeout, and fallback patterns
/// </summary>
public static class ResiliencePolicies
{
    private static readonly Meter Meter = new("EntityConfigurationService.Resilience", "1.0");
    private static readonly Counter<long> CircuitBreakerOpenCounter = Meter.CreateCounter<long>("circuit_breaker_open_total");
    private static readonly Counter<long> RetryCounter = Meter.CreateCounter<long>("retry_count_total");
    private static readonly Counter<long> TimeoutCounter = Meter.CreateCounter<long>("timeout_count_total");

    /// <summary>
    /// Retry policy with exponential backoff and jitter for HTTP calls
    /// Retries on transient failures (5xx, network errors, timeouts)
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetHttpRetryPolicy(
        string serviceName,
        ILogger logger,
        int maxRetryAttempts = 3)
    {
        var jitterer = new Random();

        return Policy
            .HandleResult<HttpResponseMessage>(r =>
                (int)r.StatusCode >= 500 || // Server errors
                r.StatusCode == System.Net.HttpStatusCode.RequestTimeout ||
                r.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            .Or<HttpRequestException>()
            .Or<TaskCanceledException>() // Timeout
            .Or<TimeoutRejectedException>() // Polly timeout
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
                        "Retry {RetryCount}/{MaxRetries} for {ServiceName} after {Delay}ms. Reason: {Reason}",
                        retryCount,
                        maxRetryAttempts,
                        serviceName,
                        timespan.TotalMilliseconds,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString() ?? "Unknown");
                });
    }

    /// <summary>
    /// Circuit breaker policy to prevent cascading failures
    /// Opens after 5 consecutive failures, stays open for 30 seconds
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
                    logger.LogError(
                        "Circuit breaker opened for {ServiceName} for {Duration}s. Reason: {Reason}",
                        serviceName,
                        duration.TotalSeconds,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString() ?? "Unknown");
                },
                onReset: () =>
                {
                    logger.LogInformation("Circuit breaker reset for {ServiceName}", serviceName);
                },
                onHalfOpen: () =>
                {
                    logger.LogInformation("Circuit breaker half-open for {ServiceName} - testing connection", serviceName);
                });
    }

    /// <summary>
    /// Timeout policy to prevent hanging requests
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy(
        string serviceName,
        ILogger logger,
        TimeSpan timeout = default)
    {
        if (timeout == default)
            timeout = TimeSpan.FromSeconds(30);

        return Policy
            .TimeoutAsync<HttpResponseMessage>(
                timeout,
                TimeoutStrategy.Optimistic,
                onTimeoutAsync: (context, timespan, task) =>
                {
                    TimeoutCounter.Add(1, new KeyValuePair<string, object?>("service", serviceName));
                    logger.LogWarning(
                        "Timeout after {Timeout}s for {ServiceName}",
                        timespan.TotalSeconds,
                        serviceName);
                    return Task.CompletedTask;
                });
    }

    /// <summary>
    /// Combined policy wrapping all resilience patterns
    /// Order: CircuitBreaker → Retry → Timeout
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetCombinedHttpPolicy(
        string serviceName,
        ILogger logger,
        ResilienceOptions? options = null)
    {
        options ??= new ResilienceOptions();

        var timeoutPolicy = GetTimeoutPolicy(serviceName, logger, options.Timeout);
        var retryPolicy = GetHttpRetryPolicy(serviceName, logger, options.MaxRetryAttempts);
        var circuitBreakerPolicy = GetCircuitBreakerPolicy(
            serviceName,
            logger,
            options.CircuitBreakerThreshold,
            options.CircuitBreakerDuration);

        // Wrap policies in correct order (outer to inner)
        return Policy.WrapAsync(
            circuitBreakerPolicy,
            retryPolicy,
            timeoutPolicy);
    }

    /// <summary>
    /// Configuration options for resilience policies
    /// </summary>
    public class ResilienceOptions
    {
        public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(30);
        public int MaxRetryAttempts { get; set; } = 3;
        public int CircuitBreakerThreshold { get; set; } = 5;
        public TimeSpan CircuitBreakerDuration { get; set; } = TimeSpan.FromSeconds(30);
    }
}

