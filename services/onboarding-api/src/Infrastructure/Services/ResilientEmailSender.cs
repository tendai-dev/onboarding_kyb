using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Notification.Interfaces;
using Polly;
using Polly.CircuitBreaker;
using Polly.Timeout;
using SendGrid;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Resilient email sender that wraps the base email sender with:
/// - Retry with exponential backoff
/// - Circuit breaker for API failures
/// - Timeout protection
/// - Dead letter queue for failed emails
/// </summary>
public class ResilientEmailSender : IEmailSender
{
    private readonly SendGridEmailSender _innerSender;
    private readonly IEmailDeadLetterQueue _deadLetterQueue;
    private readonly ILogger<ResilientEmailSender> _logger;
    private readonly IAsyncPolicy _resiliencePolicy;

    private static readonly Random Jitter = new();

    public ResilientEmailSender(
        SendGridEmailSender innerSender,
        IEmailDeadLetterQueue deadLetterQueue,
        ILogger<ResilientEmailSender> logger)
    {
        _innerSender = innerSender;
        _deadLetterQueue = deadLetterQueue;
        _logger = logger;
        _resiliencePolicy = CreateResiliencePolicy();
    }

    private IAsyncPolicy CreateResiliencePolicy()
    {
        // Timeout policy: 10 seconds per attempt
        var timeoutPolicy = Policy.TimeoutAsync(
            TimeSpan.FromSeconds(10),
            TimeoutStrategy.Optimistic,
            onTimeoutAsync: (context, timespan, task) =>
            {
                _logger.LogWarning("Email send timed out after {Timeout}s", timespan.TotalSeconds);
                return Task.CompletedTask;
            });

        // Retry policy: 3 retries with exponential backoff + jitter
        var retryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<TimeoutRejectedException>()
            .Or<Exception>(ex => IsTransientError(ex))
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt =>
                {
                    var exponentialDelay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    var jitter = TimeSpan.FromMilliseconds(Jitter.Next(0, 1000));
                    return exponentialDelay + jitter;
                },
                onRetry: (exception, timespan, retryAttempt, context) =>
                {
                    _logger.LogWarning(
                        "Email send retry {Attempt}/3. Waiting {Delay}ms. Error: {Error}",
                        retryAttempt, timespan.TotalMilliseconds, exception.Message);
                });

        // Circuit breaker: Opens after 5 failures, stays open for 30 seconds
        var circuitBreakerPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<TimeoutRejectedException>()
            .Or<Exception>(ex => IsTransientError(ex))
            .CircuitBreakerAsync(
                exceptionsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (exception, duration) =>
                {
                    _logger.LogError(
                        "Email circuit breaker OPEN for {Duration}s. Reason: {Reason}",
                        duration.TotalSeconds, exception.Message);
                },
                onReset: () =>
                {
                    _logger.LogInformation("Email circuit breaker RESET. Service recovered.");
                },
                onHalfOpen: () =>
                {
                    _logger.LogInformation("Email circuit breaker HALF-OPEN. Testing service...");
                });

        // Wrap policies: CircuitBreaker → Retry → Timeout
        return Policy.WrapAsync(circuitBreakerPolicy, retryPolicy, timeoutPolicy);
    }

    public async Task SendEmailAsync(
        string to,
        string subject,
        string content,
        CancellationToken cancellationToken = default)
    {
        var emailMessage = new FailedEmailMessage
        {
            Id = Guid.NewGuid(),
            To = to,
            Subject = subject,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            RetryCount = 0
        };

        try
        {
            await _resiliencePolicy.ExecuteAsync(async () =>
            {
                await _innerSender.SendEmailAsync(to, subject, content, cancellationToken);
            });

            _logger.LogInformation(
                "Email sent successfully to {To} with subject '{Subject}'",
                to, subject);
        }
        catch (BrokenCircuitException ex)
        {
            _logger.LogError(
                "Email circuit breaker is open. Queueing email to {To} for later retry. Error: {Error}",
                to, ex.Message);

            await QueueForRetryAsync(emailMessage, "Circuit breaker open", cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send email to {To} after all retries. Queueing for dead letter processing.",
                to);

            await QueueForRetryAsync(emailMessage, ex.Message, cancellationToken);
        }
    }

    private async Task QueueForRetryAsync(
        FailedEmailMessage message,
        string failureReason,
        CancellationToken cancellationToken)
    {
        message.LastError = failureReason;
        message.LastAttemptAt = DateTime.UtcNow;

        try
        {
            await _deadLetterQueue.EnqueueAsync(message, cancellationToken);
            _logger.LogWarning(
                "Email to {To} queued for retry. Reason: {Reason}",
                message.To, failureReason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "CRITICAL: Failed to queue email to dead letter. Email to {To} may be lost!",
                message.To);
        }
    }

    private static bool IsTransientError(Exception ex)
    {
        var message = ex.Message.ToLowerInvariant();
        return message.Contains("rate limit") ||
               message.Contains("timeout") ||
               message.Contains("network") ||
               message.Contains("connection") ||
               message.Contains("503") ||
               message.Contains("502") ||
               message.Contains("429");
    }
}

/// <summary>
/// Interface for email dead letter queue
/// </summary>
public interface IEmailDeadLetterQueue
{
    Task EnqueueAsync(FailedEmailMessage message, CancellationToken cancellationToken = default);
    Task<List<FailedEmailMessage>> DequeueAsync(int batchSize = 10, CancellationToken cancellationToken = default);
    Task MarkAsProcessedAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task IncrementRetryCountAsync(Guid messageId, string error, CancellationToken cancellationToken = default);
}

/// <summary>
/// Failed email message for dead letter queue
/// </summary>
public class FailedEmailMessage
{
    public Guid Id { get; set; }
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastAttemptAt { get; set; }
    public int RetryCount { get; set; }
    public string? LastError { get; set; }
    public bool IsHtml { get; set; }
}
