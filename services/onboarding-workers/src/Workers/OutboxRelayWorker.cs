using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace OnboardingWorkers.Workers;

/// <summary>
/// Background worker that processes outbox events (no-op without Kafka)
/// Implements transactional outbox pattern - events are marked as processed but not published
/// </summary>
public class OutboxRelayWorker : BackgroundService
{
    private readonly ILogger<OutboxRelayWorker> _logger;
    private readonly IConfiguration _configuration;

    public OutboxRelayWorker(ILogger<OutboxRelayWorker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox Relay Worker starting (no-op mode - Kafka disabled)...");

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
        // Check if the outbox_events table exists in this schema
        var tableExistsSql = $@"
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = @Schema 
                AND table_name = 'outbox_events'
            )";

        await using var checkCmd = new NpgsqlCommand(tableExistsSql, connection);
        checkCmd.Parameters.AddWithValue("@Schema", schema);
        var tableExists = await checkCmd.ExecuteScalarAsync(cancellationToken) as bool? ?? false;

        if (!tableExists)
        {
            _logger.LogDebug("Outbox table does not exist in schema {Schema}, skipping", schema);
            return;
        }

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
            "Processing {Count} events from {Schema}.outbox_events (no-op mode - Kafka disabled)",
            events.Count, schema);

        // Mark events as processed without publishing to Kafka
        var publishedIds = new List<Guid>();

        foreach (var evt in events)
        {
            // Log the event but don't publish (no-op mode)
            _logger.LogDebug(
                "Event processed (no-op): {EventId} of type {EventType} from {AggregateType}",
                evt.Id, evt.EventType, evt.AggregateType);

            publishedIds.Add(evt.Id);
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

