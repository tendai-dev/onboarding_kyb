using Confluent.Kafka;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RiskService.Domain.Events;
using System.Text.Json;

namespace RiskService.Application.EventHandlers;

public class RiskAssessmentCompletedEventHandler : INotificationHandler<RiskAssessmentCompletedEvent>
{
    private readonly ILogger<RiskAssessmentCompletedEventHandler> _logger;
    private readonly IConfiguration _configuration;

    public RiskAssessmentCompletedEventHandler(ILogger<RiskAssessmentCompletedEventHandler> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task Handle(RiskAssessmentCompletedEvent notification, CancellationToken cancellationToken)
    {
        var bootstrap = _configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
        var topic = _configuration["Kafka:RiskTopic"] ?? "kyc.risk.events";

        var config = new ProducerConfig
        {
            BootstrapServers = bootstrap,
            Acks = Acks.All,
            EnableIdempotence = true
        };

        using var producer = new ProducerBuilder<string, string>(config).Build();

        var payload = new
        {
            eventType = "RiskAssessmentCompleted",
            notification.AssessmentId,
            notification.CaseId,
            notification.PartnerId,
            notification.RiskLevel,
            notification.RiskScore,
            notification.AssessedBy
        };

        var message = new Message<string, string>
        {
            Key = notification.AssessmentId.ToString(),
            Value = JsonSerializer.Serialize(payload)
        };

        var result = await producer.ProduceAsync(topic, message, cancellationToken);
        _logger.LogInformation("Published RiskAssessmentCompleted to {Topic} @ {Partition}/{Offset}", topic, result.Partition.Value, result.Offset.Value);
    }
}


