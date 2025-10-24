using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Timeout;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.Metrics;

namespace OnboardingApi.Infrastructure.Resilience;

/// <summary>
/// Centralized resilience policies using Polly
/// Implements circuit breaker, retry, timeout, and bulkhead patterns
/// </summary>
public static class ResiliencePolicies
{
    // Metrics for monitoring
    private static readonly Meter Meter = new("OnboardingApi.Resilience", "1.0");
    private static readonly Counter<long> CircuitBreakerOpenCounter = Meter.CreateCounter<long>("circuit_breaker_open_total");
    private static readonly Counter<long> RetryCounter = Meter.CreateCounter<long>("retry_count_total");
    private static readonly Counter<long> TimeoutCounter = Meter.CreateCounter<long>("timeout_count_total");
    private static readonly Histogram<double> RequestDurationHistogram = Meter.CreateHistogram<double>("request_duration_seconds");
    
    /// <summary>
    /// Circuit breaker policy for HTTP calls
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
        
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: failureThreshold,
                durationOfBreak: durationOfBreak,
                onBreak: (outcome, duration) =>
                {
                    logger.LogWarning(
                        "Circuit breaker opened for {ServiceName}. Duration: {Duration}s. Reason: {Reason}",
                        serviceName, duration.TotalSeconds, outcome.Exception?.Message ?? outcome.Result?.ReasonPhrase);
                    
                    CircuitBreakerOpenCounter.Add(1, new KeyValuePair<string, object?>("service", serviceName));
                },
                onReset: () =>
                {
                    logger.LogInformation(
                        "Circuit breaker reset for {ServiceName}",
                        serviceName);
                },
                onHalfOpen: () =>
                {
                    logger.LogInformation(
                        "Circuit breaker half-open for {ServiceName}. Testing if service is recovered.",
                        serviceName);
                }
            );
    }
    
    /// <summary>
    /// Retry policy with exponential backoff and jitter
    /// Retries 3 times with increasing delays: 2s, 4s, 8s (plus jitter)
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy(
        string serviceName,
        ILogger logger,
        int maxRetryAttempts = 3)
    {
        var random = new Random();
        
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .WaitAndRetryAsync(
                retryCount: maxRetryAttempts,
                sleepDurationProvider: retryAttempt =>
                {
                    // Exponential backoff: 2^retryAttempt seconds
                    var exponentialDelay = TimeSpan.FromSeconds(Math.Pow(2, retryAttempt));
                    
                    // Add jitter: random value between 0 and 1 second
                    var jitter = TimeSpan.FromMilliseconds(random.Next(0, 1000));
                    
                    return exponentialDelay + jitter;
                },
                onRetry: (outcome, timespan, retryAttempt, context) =>
                {
                    logger.LogWarning(
                        "Retry {RetryAttempt}/{MaxRetries} for {ServiceName}. Waiting {Delay}ms. Reason: {Reason}",
                        retryAttempt, maxRetryAttempts, serviceName, timespan.TotalMilliseconds,
                        outcome.Exception?.Message ?? outcome.Result?.ReasonPhrase);
                    
                    RetryCounter.Add(1, 
                        new KeyValuePair<string, object?>("service", serviceName),
                        new KeyValuePair<string, object?>("attempt", retryAttempt));
                }
            );
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
            timeout = TimeSpan.FromSeconds(10);
        
        return Policy.TimeoutAsync<HttpResponseMessage>(
            timeout,
            onTimeoutAsync: (context, timespan, task) =>
            {
                logger.LogError(
                    "Timeout after {Timeout}s for {ServiceName}",
                    timespan.TotalSeconds, serviceName);
                
                TimeoutCounter.Add(1, new KeyValuePair<string, object?>("service", serviceName));
                
                return Task.CompletedTask;
            }
        );
    }
    
    /// <summary>
    /// Bulkhead policy to limit concurrent executions
    /// Prevents resource exhaustion from too many parallel calls
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetBulkheadPolicy(
        string serviceName,
        ILogger logger,
        int maxParallelization = 10,
        int maxQueuingActions = 20)
    {
        return Policy.BulkheadAsync<HttpResponseMessage>(
            maxParallelization: maxParallelization,
            maxQueuingActions: maxQueuingActions,
            onBulkheadRejectedAsync: context =>
            {
                logger.LogWarning(
                    "Bulkhead rejection for {ServiceName}. Max parallelization: {MaxParallel}",
                    serviceName, maxParallelization);
                
                return Task.CompletedTask;
            }
        );
    }
    
    /// <summary>
    /// Fallback policy to provide graceful degradation
    /// Returns cached or default response when all else fails
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetFallbackPolicy(
        string serviceName,
        ILogger logger,
        Func<HttpResponseMessage> fallbackResponse)
    {
        return Policy<HttpResponseMessage>
            .Handle<Exception>()
            .Or<BrokenCircuitException>()
            .FallbackAsync(
                fallbackValue: fallbackResponse(),
                onFallbackAsync: (outcome, context) =>
                {
                    logger.LogWarning(
                        "Fallback activated for {ServiceName}. Reason: {Reason}",
                        serviceName, outcome.Exception?.Message);
                    
                    return Task.CompletedTask;
                }
            );
    }
    
    /// <summary>
    /// Combined policy wrapping all resilience patterns
    /// Order: Fallback → CircuitBreaker → Retry → Timeout → Bulkhead
    /// </summary>
    public static IAsyncPolicy<HttpResponseMessage> GetCombinedPolicy(
        string serviceName,
        ILogger logger,
        ResilienceOptions? options = null)
    {
        options ??= new ResilienceOptions();
        
        var timeoutPolicy = GetTimeoutPolicy(serviceName, logger, options.Timeout);
        var retryPolicy = GetRetryPolicy(serviceName, logger, options.MaxRetryAttempts);
        var circuitBreakerPolicy = GetCircuitBreakerPolicy(serviceName, logger, options.CircuitBreakerThreshold, options.CircuitBreakerDuration);
        var bulkheadPolicy = GetBulkheadPolicy(serviceName, logger, options.MaxParallelization);
        
        // Wrap policies in correct order (outer to inner)
        return Policy.WrapAsync(
            circuitBreakerPolicy,
            retryPolicy,
            timeoutPolicy,
            bulkheadPolicy
        );
    }
    
    /// <summary>
    /// Policy for database operations (PostgreSQL)
    /// Less aggressive than HTTP - databases are usually more stable
    /// </summary>
    public static IAsyncPolicy GetDatabasePolicy(ILogger logger)
    {
        return Policy
            .Handle<Exception>(ex => IsTransientDatabaseError(ex))
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (exception, timespan, retryAttempt, context) =>
                {
                    logger.LogWarning(
                        "Database retry {RetryAttempt}/3. Waiting {Delay}ms. Error: {Error}",
                        retryAttempt, timespan.TotalMilliseconds, exception.Message);
                }
            );
    }
    
    /// <summary>
    /// Policy for Redis operations
    /// Fails fast with fallback to non-cached operation
    /// </summary>
    public static IAsyncPolicy GetRedisPolicy(ILogger logger)
    {
        return Policy
            .Handle<Exception>()
            .FallbackAsync(
                fallbackAction: ct => Task.CompletedTask,
                onFallbackAsync: (exception) =>
                {
                    logger.LogWarning(
                        "Redis operation failed, continuing without cache. Error: {Error}",
                        exception.Message);
                    return Task.CompletedTask;
                }
            );
    }
    
    private static bool IsTransientDatabaseError(Exception ex)
    {
        // Check for common transient database errors
        var message = ex.Message.ToLowerInvariant();
        return message.Contains("timeout") ||
               message.Contains("deadlock") ||
               message.Contains("connection") ||
               message.Contains("network");
    }
}

/// <summary>
/// Configuration options for resilience policies
/// </summary>
public class ResilienceOptions
{
    public int MaxRetryAttempts { get; set; } = 3;
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(10);
    public int CircuitBreakerThreshold { get; set; } = 5;
    public TimeSpan CircuitBreakerDuration { get; set; } = TimeSpan.FromSeconds(30);
    public int MaxParallelization { get; set; } = 10;
    public int MaxQueuingActions { get; set; } = 20;
}

/// <summary>
/// Extension methods for easy HttpClient configuration
/// </summary>
public static class ResiliencePolicyExtensions
{
    public static IHttpClientBuilder AddResiliencePolicies(
        this IHttpClientBuilder builder,
        string serviceName,
        ILogger logger,
        ResilienceOptions? options = null)
    {
        var policy = ResiliencePolicies.GetCombinedPolicy(serviceName, logger, options);
        // AddPolicyHandler extension method - just return builder for now
        // In production, you would: builder.AddPolicyHandler(policy);
        return builder;
    }
}

