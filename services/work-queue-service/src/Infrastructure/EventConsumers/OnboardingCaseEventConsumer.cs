using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using WorkQueueService.Application.Commands;
using WorkQueueService.Domain.ValueObjects;
using MediatR;
using System.Linq;

namespace WorkQueueService.Infrastructure.EventConsumers;

/// <summary>
/// Kafka consumer that listens to onboarding case events and creates work items automatically
/// </summary>
public class OnboardingCaseEventConsumer : BackgroundService
{
    private readonly IConsumer<Ignore, string> _consumer;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OnboardingCaseEventConsumer> _logger;
    private readonly string _topicName;

    public OnboardingCaseEventConsumer(
        IConsumer<Ignore, string> consumer,
        IServiceProvider serviceProvider,
        ILogger<OnboardingCaseEventConsumer> logger,
        IConfiguration configuration)
    {
        _consumer = consumer;
        _serviceProvider = serviceProvider;
        _logger = logger;
        _topicName = configuration["Kafka:DomainEventsTopic"] ?? "onboarding.domain-events";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OnboardingCaseEventConsumer starting...");
        
        // Delay to allow HTTP server to start first
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        try
        {
            _consumer.Subscribe(_topicName);
            _logger.LogInformation("Subscribed to topic: {Topic}", _topicName);
        }
        catch (KafkaException ex)
        {
            _logger.LogWarning(ex, "Could not subscribe to topic {Topic}. Will retry on first message. Error: {Error}", 
                _topicName, ex.Message);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = _consumer.Consume(TimeSpan.FromSeconds(1));
                
                if (result == null || result.IsPartitionEOF)
                {
                    continue;
                }

                await ProcessMessageAsync(result, stoppingToken);
            }
            catch (ConsumeException ex)
            {
                _logger.LogDebug("Kafka consume error: {Error}. Will retry...", ex.Error.Reason);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("OnboardingCaseEventConsumer is stopping...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error consuming message from Kafka");
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }

        _consumer.Close();
        _logger.LogInformation("OnboardingCaseEventConsumer stopped");
    }

    private async Task ProcessMessageAsync(ConsumeResult<Ignore, string> result, CancellationToken cancellationToken)
    {
        try
        {
            // Extract trace ID from message headers
            var traceId = "unknown";
            if (result.Message.Headers != null)
            {
                var traceIdHeader = result.Message.Headers.FirstOrDefault(h => 
                    h.Key.Equals("trace-id", StringComparison.OrdinalIgnoreCase) || 
                    h.Key.Equals("x-trace-id", StringComparison.OrdinalIgnoreCase));
                if (traceIdHeader.Key != null)
                {
                    traceId = Encoding.UTF8.GetString(traceIdHeader.Value);
                }
            }

            using var doc = JsonDocument.Parse(result.Message.Value);
            var root = doc.RootElement;

            // Handle both camelCase and PascalCase event properties
            var eventType = root.TryGetProperty("eventType", out var eventTypeProp) 
                ? eventTypeProp.GetString() 
                : root.TryGetProperty("EventType", out var eventTypeProp2) 
                    ? eventTypeProp2.GetString() 
                    : root.GetProperty("Type").GetString();
            
            // Handle both camelCase and PascalCase caseId
            var caseIdStr = root.TryGetProperty("caseId", out var caseIdProp) 
                ? caseIdProp.GetString() 
                : root.TryGetProperty("CaseId", out var caseIdProp2) 
                    ? caseIdProp2.GetString() 
                    : null;

            if (string.IsNullOrEmpty(eventType) || string.IsNullOrEmpty(caseIdStr))
            {
                _logger.LogWarning("Invalid event message: missing eventType or caseId. TraceId: {TraceId}", traceId);
                return;
            }

            _logger.LogInformation("Received event: {EventType} for case {CaseId} (TraceId: {TraceId})", 
                eventType, caseIdStr, traceId);

            using var scope = _serviceProvider.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

            // Normalize event type name (handle both with/without Event suffix)
            var normalizedEventType = eventType;
            if (!normalizedEventType.EndsWith("Event", StringComparison.OrdinalIgnoreCase))
            {
                normalizedEventType = normalizedEventType + "Event";
            }

            switch (normalizedEventType)
            {
                case "OnboardingCaseSubmittedEvent":
                    await HandleCaseSubmittedEvent(root, mediator, cancellationToken);
                    break;
                case "OnboardingCaseApprovedEvent":
                    await HandleCaseApprovedEvent(root, mediator, cancellationToken);
                    break;
                case "OnboardingCaseRejectedEvent":
                    await HandleCaseRejectedEvent(root, mediator, cancellationToken);
                    break;
                default:
                    _logger.LogDebug("Ignoring event type: {EventType} (normalized: {Normalized})", eventType, normalizedEventType);
                    break;
            }
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Missing expected property in event message");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse event message as JSON");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing event message");
        }
    }

    private async Task HandleCaseSubmittedEvent(JsonElement root, IMediator mediator, CancellationToken cancellationToken)
    {
        try
        {
            // Handle both camelCase and PascalCase property names
            var caseIdStr = root.TryGetProperty("CaseId", out var caseIdProp) 
                ? caseIdProp.GetString() 
                : root.TryGetProperty("caseId", out var caseIdProp2) 
                    ? caseIdProp2.GetString() 
                    : throw new InvalidOperationException("CaseId is required");
            var caseId = Guid.Parse(caseIdStr ?? throw new InvalidOperationException("CaseId is required"));
            
            var caseNumber = root.TryGetProperty("CaseNumber", out var caseNumProp) 
                ? caseNumProp.GetString() 
                : root.TryGetProperty("caseNumber", out var caseNumProp2) 
                    ? caseNumProp2.GetString() 
                    : "UNKNOWN";
            
            var typeProp = root.TryGetProperty("Type", out var typeProp1) 
                ? typeProp1 
                : root.TryGetProperty("type", out var typeProp2) 
                    ? typeProp2 
                    : throw new InvalidOperationException("Type is required");
            
            var typeStr = typeProp.ValueKind == JsonValueKind.String 
                ? typeProp.GetString() 
                : typeProp.GetInt32().ToString(); // Enum as int
            if (typeStr == "0" || typeStr == "1") typeStr = "Individual";
            if (typeStr == "2") typeStr = "Business";
            
            var partnerIdStr = root.TryGetProperty("PartnerId", out var partnerIdProp) 
                ? partnerIdProp.GetString() 
                : root.TryGetProperty("partnerId", out var partnerIdProp2) 
                    ? partnerIdProp2.GetString() 
                    : throw new InvalidOperationException("PartnerId is required");
            var partnerId = Guid.Parse(partnerIdStr ?? throw new InvalidOperationException("PartnerId is required"));

            // Try to extract applicant details from event payload
            // If not available, we'll use defaults and the risk service can update later
            var applicantName = "Unknown Applicant";
            var country = "Unknown";
            var entityType = typeStr;

            // Try to get applicant details from nested structure
            if (root.TryGetProperty("applicant", out var applicantProp))
            {
                if (applicantProp.TryGetProperty("firstName", out var firstName))
                    applicantName = firstName.GetString() ?? "";
                if (applicantProp.TryGetProperty("lastName", out var lastName))
                    applicantName = $"{applicantName} {lastName.GetString()}".Trim();
                
                if (applicantProp.TryGetProperty("nationality", out var nationality))
                    country = nationality.GetString() ?? country;
                else if (applicantProp.TryGetProperty("residentialAddress", out var address) && 
                         address.TryGetProperty("country", out var addressCountry))
                    country = addressCountry.GetString() ?? country;
            }
            
            // Try business details if it's a business case
            if (typeStr == "Business" && root.TryGetProperty("business", out var businessProp))
            {
                if (businessProp.TryGetProperty("legalName", out var legalName))
                    applicantName = legalName.GetString() ?? applicantName;
                
                if (businessProp.TryGetProperty("registeredAddress", out var busAddress) && 
                    busAddress.TryGetProperty("country", out var busCountry))
                    country = busCountry.GetString() ?? country;
            }

            // Default to Medium risk - will be updated when risk assessment is available
            // Check if risk level is in the event
            var riskLevelStr = "Medium";
            if (root.TryGetProperty("riskLevel", out var riskLevelProp))
            {
                riskLevelStr = riskLevelProp.GetString() ?? riskLevelStr;
            }

            var command = new CreateWorkItemCommand(
                ApplicationId: caseId,
                ApplicantName: applicantName,
                EntityType: entityType,
                Country: country,
                RiskLevel: riskLevelStr,
                CreatedBy: "system"
            );

            var result = await mediator.Send(command, cancellationToken);
            
            if (result.Success)
            {
                _logger.LogInformation("Created work item {WorkItemId} for case {CaseId} ({CaseNumber})", 
                    result.WorkItemId, caseId, caseNumber);
            }
            else
            {
                _logger.LogWarning("Failed to create work item for case {CaseId}: {Error}", caseId, result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling case submitted event");
        }
    }

    private async Task HandleCaseApprovedEvent(JsonElement root, IMediator mediator, CancellationToken cancellationToken)
    {
        // Find work item by application ID and mark as completed
        try
        {
            var caseId = Guid.Parse(root.GetProperty("caseId").GetString() ?? throw new InvalidOperationException("caseId is required"));
            
            // Query for work item by application ID (would need a query for this)
            _logger.LogInformation("Case {CaseId} approved - work item completion handled separately", caseId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling case approved event");
        }
    }

    private async Task HandleCaseRejectedEvent(JsonElement root, IMediator mediator, CancellationToken cancellationToken)
    {
        // Find work item by application ID and decline it
        try
        {
            var caseId = Guid.Parse(root.GetProperty("caseId").GetString() ?? throw new InvalidOperationException("caseId is required"));
            var reason = root.TryGetProperty("reason", out var reasonProp) ? reasonProp.GetString() : "Rejected";
            
            _logger.LogInformation("Case {CaseId} rejected - work item decline handled separately", caseId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling case rejected event");
        }
    }

    public override void Dispose()
    {
        _consumer?.Dispose();
        base.Dispose();
    }
}

