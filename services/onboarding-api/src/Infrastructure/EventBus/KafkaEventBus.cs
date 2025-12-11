// Kafka is no longer used - commenting out to avoid build errors
// using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Events;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace OnboardingApi.Infrastructure.EventBus;

/// <summary>
/// Kafka implementation of IEventBus - DISABLED: Kafka is no longer used
/// </summary>
public class KafkaEventBus : IEventBus, IDisposable
{
    // private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaEventBus> _logger;
    private readonly KafkaOptions _options;

    public KafkaEventBus(
        IOptions<KafkaOptions> options,
        ILogger<KafkaEventBus> logger)
    {
        _options = options.Value;
        _logger = logger;

        // Kafka is no longer used - implementation disabled
        _logger.LogWarning("KafkaEventBus is disabled - Kafka is no longer used in this project");

        /* Kafka implementation removed
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
        */
    }

    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent
    {
        // Kafka is no longer used - events are not published
        var eventType = @event.GetType().Name;
        _logger.LogWarning("KafkaEventBus.PublishAsync called for {EventType} but Kafka is disabled", eventType);
        await Task.CompletedTask;
    }

    public async Task PublishIntegrationEventAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        // Kafka is no longer used - events are not published
        _logger.LogWarning("KafkaEventBus.PublishIntegrationEventAsync called for {EventType} but Kafka is disabled", @event.EventType);
        await Task.CompletedTask;
    }

    public void Dispose()
    {
        // Nothing to dispose - Kafka producer is not initialized
    }
}

public class KafkaOptions
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string DomainEventsTopic { get; set; } = "onboarding.domain-events";
    public string IntegrationEventsTopic { get; set; } = "onboarding.integration-events";
}

