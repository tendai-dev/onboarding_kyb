using Confluent.Kafka;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using Polly;

namespace OnboardingWorkers.Workers;

/// <summary>
/// Background worker that reliably publishes outbox events to Kafka
/// Implements transactional outbox pattern for guaranteed event delivery
/// </summary>
public class OutboxRelayWorker : BackgroundService
{
    private readonly ILogger<OutboxRelayWorker> _logger;
    private readonly IConfiguration _configuration;
    private readonly IAsyncPolicy _retryPolicy;
    private IProducer<string, string>? _producer;

    public OutboxRelayWorker(ILogger<OutboxRelayWorker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        
        _retryPolicy = Policy
            .Handle<Exception>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                onRetry: (exception, timespan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        exception,
                        "Retry {RetryCount} after {Delay}s",
                        retryCount, timespan.TotalSeconds);
                });
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox Relay Worker starting...");

        // Initialize Kafka producer
        var config = new ProducerConfig
        {
            BootstrapServers = _configuration["Kafka:BootstrapServers"] ?? _configuration["Kafka__BootstrapServers"] ?? "localhost:9092",
            Acks = Acks.All,
            EnableIdempotence = true,
            MaxInFlight = 5,
            MessageTimeoutMs = 30000,
            CompressionType = CompressionType.Snappy
        };

        _producer = new ProducerBuilder<string, string>(config).Build();

        var batchSize = int.Parse(_configuration["OutboxRelay:BatchSize"] ?? _configuration["OUTBOX__BATCH_SIZE"] ?? "100");
        var pollIntervalMs = int.Parse(_configuration["OutboxRelay:PollIntervalMs"] ?? _configuration["OUTBOX__POLL_INTERVAL_MS"] ?? "1000");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxEventsAsync(batchSize, stoppingToken);
                await Task.Delay(pollIntervalMs, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Outbox Relay Worker stopping...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing outbox events");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _producer?.Dispose();
        _logger.LogInformation("Outbox Relay Worker stopped");
    }

    private async Task ProcessOutboxEventsAsync(int batchSize, CancellationToken cancellationToken)
    {
        var connectionString = _configuration.GetConnectionString("PostgreSQL") 
            ?? _configuration["OUTBOX__DB"] 
            ?? "Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password";

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        // Process each schema's outbox table
        var schemas = new[] { "onboarding", "documents", "checklist", "risk" };

        foreach (var schema in schemas)
        {
            await ProcessSchemaOutboxAsync(connection, schema, batchSize, cancellationToken);
        }
    }

    private async Task ProcessSchemaOutboxAsync(
        NpgsqlConnection connection,
        string schema,
        int batchSize,
        CancellationToken cancellationToken)
    {
        // Select unprocessed events with pessimistic lock (FOR UPDATE SKIP LOCKED)
        var selectSql = $@"
            SELECT id, aggregate_id, aggregate_type, event_type, payload, occurred_at
            FROM {schema}.outbox_events
            WHERE processed_at IS NULL
            ORDER BY occurred_at
            LIMIT @BatchSize
            FOR UPDATE SKIP LOCKED";

        await using var selectCmd = new NpgsqlCommand(selectSql, connection);
        selectCmd.Parameters.AddWithValue("@BatchSize", batchSize);

        var events = new List<OutboxEvent>();

        await using (var reader = await selectCmd.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                events.Add(new OutboxEvent
                {
                    Id = reader.GetGuid(0),
                    AggregateId = reader.GetGuid(1),
                    AggregateType = reader.GetString(2),
                    EventType = reader.GetString(3),
                    Payload = reader.GetString(4),
                    OccurredAt = reader.GetDateTime(5)
                });
            }
        }

        if (events.Count == 0)
        {
            return;
        }

        _logger.LogInformation(
            "Processing {Count} events from {Schema}.outbox_events",
            events.Count, schema);

        // Publish events to Kafka
        var publishedIds = new List<Guid>();

        foreach (var evt in events)
        {
            try
            {
                await _retryPolicy.ExecuteAsync(async () =>
                {
                    await PublishEventAsync(evt, cancellationToken);
                });

                publishedIds.Add(evt.Id);

                _logger.LogDebug(
                    "Published event {EventId} of type {EventType}",
                    evt.Id, evt.EventType);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to publish event {EventId} after retries, will retry in next batch",
                    evt.Id);
            }
        }

        // Mark published events as processed
        if (publishedIds.Count > 0)
        {
            var updateSql = $@"
                UPDATE {schema}.outbox_events
                SET processed_at = @ProcessedAt
                WHERE id = ANY(@Ids)";

            await using var updateCmd = new NpgsqlCommand(updateSql, connection);
            updateCmd.Parameters.AddWithValue("@ProcessedAt", DateTime.UtcNow);
            updateCmd.Parameters.AddWithValue("@Ids", publishedIds.ToArray());

            var updated = await updateCmd.ExecuteNonQueryAsync(cancellationToken);

            _logger.LogInformation(
                "Marked {Count} events as processed in {Schema}.outbox_events",
                updated, schema);
        }
    }

    private async Task PublishEventAsync(OutboxEvent evt, CancellationToken cancellationToken)
    {
        var topic = DetermineTopicFromEventType(evt.EventType);

        var message = new Message<string, string>
        {
            Key = evt.AggregateId.ToString(),
            Value = evt.Payload,
            Headers = new Headers
            {
                { "event-id", System.Text.Encoding.UTF8.GetBytes(evt.Id.ToString()) },
                { "event-type", System.Text.Encoding.UTF8.GetBytes(evt.EventType) },
                { "aggregate-type", System.Text.Encoding.UTF8.GetBytes(evt.AggregateType) },
                { "occurred-at", System.Text.Encoding.UTF8.GetBytes(evt.OccurredAt.ToString("O")) }
            }
        };

        var result = await _producer!.ProduceAsync(topic, message, cancellationToken);

        if (result.Status != PersistenceStatus.Persisted)
        {
            throw new Exception($"Event not persisted to Kafka: {result.Status}");
        }
    }

    private static string DetermineTopicFromEventType(string eventType)
    {
        // Map event types to topics - use configuration if available, otherwise use defaults
        return eventType switch
        {
            var t when t.StartsWith("Onboarding") => "kyb.case.submitted.v1",
            var t when t.StartsWith("Document") => "kyb.doc.uploaded.v1",
            var t when t.StartsWith("Checklist") => "kyb.checklist.updated.v1",
            var t when t.StartsWith("Risk") => "kyb.risk.assessed.v1",
            _ => "kyb.domain-events.v1"
        };
    }

    private class OutboxEvent
    {
        public Guid Id { get; set; }
        public Guid AggregateId { get; set; }
        public string AggregateType { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Payload { get; set; } = string.Empty;
        public DateTime OccurredAt { get; set; }
    }
}

