using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using Polly.Timeout;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Resilience;

/// <summary>
/// Polly resilience policies for HTTP calls and external dependencies
/// </summary>
public static class PollyPolicies
{
    private static ILogger? _logger;

    /// <summary>
    /// Initialize logger for policies (call this during startup)
    /// </summary>
    public static void Initialize(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Retry policy with exponential backoff and jitter
    /// </summary>
    public static AsyncRetryPolicy<HttpResponseMessage> GetHttpRetryPolicy()
    {
        var jitterer = new Random();

        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode && r.StatusCode != System.Net.HttpStatusCode.BadRequest)
            .Or<HttpRequestException>()
            .Or<TaskCanceledException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt))
                                                  + TimeSpan.FromMilliseconds(jitterer.Next(0, 1000)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    // SECURITY FIX: Use logger instead of Console.WriteLine
                    _logger?.LogWarning("HTTP retry {RetryCount} after {Seconds}s due to {Reason}", 
                        retryCount, 
                        timespan.TotalSeconds, 
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
                });
    }

    /// <summary>
    /// Circuit breaker policy
    /// </summary>
    public static AsyncCircuitBreakerPolicy<HttpResponseMessage> GetHttpCircuitBreakerPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, duration) =>
                {
                    // SECURITY FIX: Use logger instead of Console.WriteLine
                    _logger?.LogWarning("Circuit breaker opened for {Seconds}s", duration.TotalSeconds);
                },
                onReset: () =>
                {
                    // SECURITY FIX: Use logger instead of Console.WriteLine
                    _logger?.LogInformation("Circuit breaker reset");
                },
                onHalfOpen: () =>
                {
                    // SECURITY FIX: Use logger instead of Console.WriteLine
                    _logger?.LogInformation("Circuit breaker half-open");
                });
    }

    /// <summary>
    /// Timeout policy
    /// </summary>
    public static AsyncTimeoutPolicy<HttpResponseMessage> GetHttpTimeoutPolicy(int timeoutSeconds = 30)
    {
        return Policy
            .TimeoutAsync<HttpResponseMessage>(
                TimeSpan.FromSeconds(timeoutSeconds),
                TimeoutStrategy.Optimistic);
    }

    /// <summary>
    /// Combined policy: Timeout -> Retry -> Circuit Breaker
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetCombinedHttpPolicy()
    {
        return Policy.WrapAsync(
            GetHttpCircuitBreakerPolicy(),
            GetHttpRetryPolicy(),
            GetHttpTimeoutPolicy());
    }
}

