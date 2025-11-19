using AuditLogService.Application.EventHandlers;
using Confluent.Kafka;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Text;

namespace AuditLogService.Infrastructure.EventConsumers;

/// <summary>
/// Background service that consumes domain events from Kafka and creates audit log entries
/// </summary>
public class KafkaEventConsumer : BackgroundService
{
    private readonly IConsumer<string, string> _consumer;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<KafkaEventConsumer> _logger;
    private readonly string[] _topics;

    public KafkaEventConsumer(
        IConfiguration configuration,
        IServiceProvider serviceProvider,
        ILogger<KafkaEventConsumer> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;

        var bootstrapServers = configuration["Kafka:BootstrapServers"] ?? configuration["KAFKA__BOOTSTRAPSERVERS"] ?? "kafka:9092";
        var groupId = configuration["Kafka:ConsumerGroup"] ?? configuration["KAFKA__CONSUMERGROUP"] ?? "auditlog-service-group";
        
        logger.LogInformation("Kafka BootstrapServers: {BootstrapServers}, ConsumerGroup: {ConsumerGroup}", bootstrapServers, groupId);

        var consumerConfig = new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = groupId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true,
            AutoCommitIntervalMs = 5000,
            SessionTimeoutMs = 30000,
            MaxPollIntervalMs = 300000
        };

        _consumer = new ConsumerBuilder<string, string>(consumerConfig)
            .SetErrorHandler((_, e) => logger.LogError("Kafka consumer error: {Reason}", e.Reason))
            .Build();

        // Subscribe to multiple topics that contain domain events
        _topics = new[]
        {
            configuration["Kafka:DomainEventsTopic"] ?? "onboarding.domain-events",
            "documents.domain-events",
            "risk.domain-events",
            "checklist.domain-events",
            "messaging.domain-events"
        };

        _consumer.Subscribe(_topics);
        _logger.LogInformation("Kafka consumer subscribed to topics: {Topics}", string.Join(", ", _topics));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting Kafka event consumer for audit log service");
        
        // Wait a bit for Kafka to be ready and HTTP server to start
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Use timeout to prevent blocking indefinitely
                    using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    cts.CancelAfter(TimeSpan.FromSeconds(5));
                    var result = _consumer.Consume(cts.Token);
                    
                    if (result?.Message == null)
                        continue;

                    var eventType = GetEventType(result.Message.Headers, result.Topic);
                    var eventPayload = result.Message.Value;

                    _logger.LogDebug(
                        "Received event {EventType} from topic {Topic}, partition {Partition}, offset {Offset}",
                        eventType, result.Topic, result.Partition, result.Offset);

                    // Create a scope for each message to resolve scoped dependencies
                    using var scope = _serviceProvider.CreateScope();
                    var eventHandler = scope.ServiceProvider.GetRequiredService<DomainEventAuditLogHandler>();
                    await eventHandler.HandleDomainEventAsync(eventType, eventPayload, stoppingToken);

                    // Commit offset manually if auto-commit is disabled
                    // _consumer.Commit(result);
                }
                catch (ConsumeException ex)
                {
                    // Ignore "unknown topic" errors - topics will be created when events are published
                    if (!ex.Message.Contains("Unknown topic or partition"))
                    {
                        _logger.LogError(ex, "Error consuming message from Kafka");
                    }
                    else
                    {
                        _logger.LogDebug("Topic not yet available: {Error}", ex.Message);
                    }
                    // Continue processing - don't crash the service
                    await Task.Delay(5000, stoppingToken); // Wait a bit before retrying
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error in Kafka consumer");
                    // Continue processing
                    await Task.Delay(1000, stoppingToken);
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Kafka consumer is shutting down");
        }
        finally
        {
            _consumer.Close();
            _consumer.Dispose();
        }
    }

    private string GetEventType(Headers headers, string topic)
    {
        // Try to get event type from headers first
        if (headers.TryGetLastBytes("event-type", out var eventTypeBytes))
        {
            return Encoding.UTF8.GetString(eventTypeBytes);
        }

        // Fallback: infer from topic or payload
        return topic switch
        {
            var t when t.Contains("onboarding") => "OnboardingCaseEvent",
            var t when t.Contains("document") => "DocumentEvent",
            var t when t.Contains("risk") => "RiskAssessmentEvent",
            var t when t.Contains("checklist") => "ChecklistEvent",
            var t when t.Contains("messaging") => "MessageEvent",
            _ => "UnknownEvent"
        };
    }

    public override void Dispose()
    {
        _consumer?.Dispose();
        base.Dispose();
    }
}

