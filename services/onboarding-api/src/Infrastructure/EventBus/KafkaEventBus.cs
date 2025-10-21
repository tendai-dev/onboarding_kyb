using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;
using System.Text.Json;

namespace OnboardingApi.Infrastructure.EventBus;

/// <summary>
/// Kafka implementation of IEventBus
/// </summary>
public class KafkaEventBus : IEventBus, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaEventBus> _logger;
    private readonly KafkaOptions _options;

    public KafkaEventBus(
        IOptions<KafkaOptions> options,
        ILogger<KafkaEventBus> logger)
    {
        _options = options.Value;
        _logger = logger;

        var config = new ProducerConfig
        {
            BootstrapServers = _options.BootstrapServers,
            Acks = Acks.All,
            EnableIdempotence = true,
            MaxInFlight = 5,
            MessageTimeoutMs = 30000,
            RequestTimeoutMs = 30000,
            RetryBackoffMs = 100,
            CompressionType = CompressionType.Snappy,
            ClientId = "onboarding-api"
        };

        _producer = new ProducerBuilder<string, string>(config)
            .SetKeySerializer(Serializers.Utf8)
            .SetValueSerializer(Serializers.Utf8)
            .Build();
    }

    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent
    {
        var eventType = @event.GetType().Name;
        var topic = _options.DomainEventsTopic;

        var message = new Message<string, string>
        {
            Key = @event.EventId.ToString(),
            Value = JsonSerializer.Serialize(@event),
            Headers = new Headers
            {
                { "event-type", System.Text.Encoding.UTF8.GetBytes(eventType) },
                { "event-id", System.Text.Encoding.UTF8.GetBytes(@event.EventId.ToString()) },
                { "occurred-at", System.Text.Encoding.UTF8.GetBytes(@event.OccurredAt.ToString("O")) }
            }
        };

        try
        {
            var result = await _producer.ProduceAsync(topic, message, cancellationToken);

            _logger.LogInformation(
                "Published domain event {EventType} to topic {Topic}, partition {Partition}, offset {Offset}",
                eventType,
                topic,
                result.Partition.Value,
                result.Offset.Value);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish domain event {EventType} to topic {Topic}",
                eventType,
                topic);
            throw;
        }
    }

    public async Task PublishIntegrationEventAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        var topic = _options.IntegrationEventsTopic;

        var message = new Message<string, string>
        {
            Key = @event.EventId.ToString(),
            Value = JsonSerializer.Serialize(@event),
            Headers = new Headers
            {
                { "event-type", System.Text.Encoding.UTF8.GetBytes(@event.EventType) },
                { "event-id", System.Text.Encoding.UTF8.GetBytes(@event.EventId.ToString()) },
                { "occurred-at", System.Text.Encoding.UTF8.GetBytes(@event.OccurredAt.ToString("O")) }
            }
        };

        try
        {
            var result = await _producer.ProduceAsync(topic, message, cancellationToken);

            _logger.LogInformation(
                "Published integration event {EventType} to topic {Topic}, partition {Partition}, offset {Offset}",
                @event.EventType,
                topic,
                result.Partition.Value,
                result.Offset.Value);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish integration event {EventType} to topic {Topic}",
                @event.EventType,
                topic);
            throw;
        }
    }

    public void Dispose()
    {
        _producer?.Flush(TimeSpan.FromSeconds(10));
        _producer?.Dispose();
    }
}

public class KafkaOptions
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string DomainEventsTopic { get; set; } = "onboarding.domain-events";
    public string IntegrationEventsTopic { get; set; } = "onboarding.integration-events";
}

