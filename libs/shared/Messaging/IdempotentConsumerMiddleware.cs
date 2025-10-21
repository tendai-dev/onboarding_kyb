using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Shared.Messaging;

/// <summary>
/// Idempotent consumer middleware for Kafka/RabbitMQ consumers
/// Prevents duplicate processing of messages using Redis
/// </summary>
public interface IIdempotentConsumer
{
    Task<bool> TryProcessAsync<TMessage>(
        string messageId,
        TMessage message,
        Func<TMessage, Task> handler,
        CancellationToken cancellationToken = default);
}

public class IdempotentConsumerMiddleware : IIdempotentConsumer
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<IdempotentConsumerMiddleware> _logger;
    private readonly TimeSpan _idempotencyWindow;

    public IdempotentConsumerMiddleware(
        IConnectionMultiplexer redis,
        ILogger<IdempotentConsumerMiddleware> logger,
        TimeSpan? idempotencyWindow = null)
    {
        _redis = redis;
        _logger = logger;
        _idempotencyWindow = idempotencyWindow ?? TimeSpan.FromHours(24);
    }

    public async Task<bool> TryProcessAsync<TMessage>(
        string messageId,
        TMessage message,
        Func<TMessage, Task> handler,
        CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        
        // Generate processing key
        var processingKey = $"consumer:processing:{messageId}";
        var processedKey = $"consumer:processed:{messageId}";

        // Check if already processed
        var alreadyProcessed = await db.KeyExistsAsync(processedKey);
        if (alreadyProcessed)
        {
            _logger.LogInformation(
                "Message {MessageId} already processed, skipping",
                messageId);
            return false;  // Already processed, skip
        }

        // Try to acquire processing lock (prevents concurrent processing)
        var lockAcquired = await db.StringSetAsync(
            processingKey,
            "processing",
            TimeSpan.FromMinutes(5),
            When.NotExists);

        if (!lockAcquired)
        {
            _logger.LogWarning(
                "Message {MessageId} is being processed by another consumer, skipping",
                messageId);
            return false;  // Another instance is processing
        }

        try
        {
            // Process the message
            _logger.LogInformation("Processing message {MessageId}", messageId);
            
            await handler(message);

            // Mark as processed
            await db.StringSetAsync(
                processedKey,
                JsonSerializer.Serialize(new
                {
                    processedAt = DateTime.UtcNow,
                    messageId
                }),
                _idempotencyWindow);

            // Remove processing lock
            await db.KeyDeleteAsync(processingKey);

            _logger.LogInformation(
                "Message {MessageId} processed successfully",
                messageId);

            return true;  // Successfully processed
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to process message {MessageId}",
                messageId);

            // Remove processing lock to allow retry
            await db.KeyDeleteAsync(processingKey);

            throw;  // Re-throw to trigger DLQ after retries
        }
    }
}

/// <summary>
/// Kafka consumer with built-in idempotency
/// </summary>
public abstract class IdempotentKafkaConsumer<TMessage>
{
    private readonly IIdempotentConsumer _idempotentConsumer;
    private readonly ILogger _logger;

    protected IdempotentKafkaConsumer(
        IIdempotentConsumer idempotentConsumer,
        ILogger logger)
    {
        _idempotentConsumer = idempotentConsumer;
        _logger = logger;
    }

    /// <summary>
    /// Process message with automatic idempotency
    /// </summary>
    public async Task ConsumeAsync(
        string key,
        string value,
        Dictionary<string, string> headers,
        CancellationToken cancellationToken = default)
    {
        // Extract message ID from headers or generate from content
        var messageId = headers.GetValueOrDefault("event-id") 
                        ?? GenerateMessageId(key, value);

        var message = JsonSerializer.Deserialize<TMessage>(value);
        if (message == null)
        {
            _logger.LogError("Failed to deserialize message: {Value}", value);
            return;
        }

        await _idempotentConsumer.TryProcessAsync(
            messageId,
            message,
            async msg => await ProcessMessageAsync(msg, headers, cancellationToken),
            cancellationToken);
    }

    /// <summary>
    /// Implement message processing logic in derived class
    /// </summary>
    protected abstract Task ProcessMessageAsync(
        TMessage message,
        Dictionary<string, string> headers,
        CancellationToken cancellationToken);

    private static string GenerateMessageId(string key, string value)
    {
        // Generate deterministic ID from message content
        var combined = $"{key}:{value}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(combined));
        return Convert.ToHexString(hash)[..32].ToLower();
    }
}

/// <summary>
/// Example usage: Domain event consumer
/// </summary>
public class OnboardingEventConsumer : IdempotentKafkaConsumer<OnboardingEvent>
{
    private readonly ILogger<OnboardingEventConsumer> _logger;
    // Inject your services here

    public OnboardingEventConsumer(
        IIdempotentConsumer idempotentConsumer,
        ILogger<OnboardingEventConsumer> logger)
        : base(idempotentConsumer, logger)
    {
        _logger = logger;
    }

    protected override async Task ProcessMessageAsync(
        OnboardingEvent message,
        Dictionary<string, string> headers,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Processing onboarding event: {EventType} for case {CaseId}",
            message.EventType, message.CaseId);

        // Your business logic here
        // This will only execute once per message ID
        await Task.CompletedTask;
    }
}

public class OnboardingEvent
{
    public string EventType { get; set; } = string.Empty;
    public Guid CaseId { get; set; }
    public string Data { get; set; } = string.Empty;
}

