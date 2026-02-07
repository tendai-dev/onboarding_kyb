using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.Persistence;
using System.Text.Json;

namespace OnboardingApi.Infrastructure.EventBus;

/// <summary>
/// Background service that processes outbox events for reliable event delivery.
/// Implements the transactional outbox pattern to ensure events are not lost on crashes.
/// Events are dispatched asynchronously to handlers, preventing blocking of HTTP requests.
/// </summary>
public class OutboxEventProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OutboxEventProcessor> _logger;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(5);
    private readonly int _batchSize = 100;
    private readonly int _maxRetries = 3;

    public OutboxEventProcessor(
        IServiceScopeFactory scopeFactory,
        ILogger<OutboxEventProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxEventProcessor started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing outbox events");
            }

            await Task.Delay(_pollingInterval, stoppingToken);
        }

        _logger.LogInformation("OutboxEventProcessor stopped");
    }

    private async Task ProcessOutboxEventsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
        var dispatcher = scope.ServiceProvider.GetRequiredService<IDomainEventDispatcher>();

        // Get unprocessed events ordered by occurrence time
        var events = await context.OutboxEvents
            .Where(e => e.ProcessedAt == null)
            .OrderBy(e => e.OccurredAt)
            .Take(_batchSize)
            .ToListAsync(cancellationToken);

        if (events.Count == 0)
            return;

        _logger.LogInformation("Processing {Count} outbox events", events.Count);

        foreach (var outboxEvent in events)
        {
            try
            {
                // ASYNC EVENT DISPATCH: Dispatch to registered handlers asynchronously
                // This runs in the background, not blocking the original HTTP request
                await dispatcher.DispatchAsync(
                    outboxEvent.EventType, 
                    outboxEvent.Payload, 
                    cancellationToken);

                // Mark as processed
                outboxEvent.ProcessedAt = DateTime.UtcNow;
                
                _logger.LogDebug(
                    "Processed outbox event {EventId} of type {EventType} for aggregate {AggregateId}",
                    outboxEvent.Id, outboxEvent.EventType, outboxEvent.AggregateId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Failed to process outbox event {EventId} of type {EventType}. Will retry.",
                    outboxEvent.Id, outboxEvent.EventType);
                // Don't mark as processed - will be retried on next poll
                // TODO: Add retry count tracking and dead-letter after max retries
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Completed processing {Count} outbox events", events.Count);
    }
}
