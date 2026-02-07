using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Commands;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.Events;
using OnboardingApi.Infrastructure.Persistence.Configurations;
using System.Text.Json;

namespace OnboardingApi.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for Onboarding API
/// </summary>
public class OnboardingDbContext : DbContext, IUnitOfWork
{
    public DbSet<OnboardingCase> OnboardingCases => Set<OnboardingCase>();
    public DbSet<OutboxEvent> OutboxEvents => Set<OutboxEvent>();
    public DbSet<OnboardingApi.Application.Commands.Application> Applications => Set<OnboardingApi.Application.Commands.Application>();

    public OnboardingDbContext(DbContextOptions<OnboardingDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("onboarding");
        
        modelBuilder.ApplyConfiguration(new OnboardingCaseConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxEventConfiguration());
    }

    /// <summary>
    /// Saves changes and persists domain events to the outbox table atomically.
    /// This ensures events are not lost on crashes (transactional outbox pattern).
    /// </summary>
    public async Task<int> SaveChangesWithOutboxAsync(CancellationToken cancellationToken = default)
    {
        // Collect domain events from all tracked aggregates BEFORE saving
        var aggregatesWithEvents = ChangeTracker.Entries<OnboardingCase>()
            .Where(e => e.Entity.DomainEvents.Any())
            .Select(e => e.Entity)
            .ToList();

        // Add events to outbox within the same transaction
        foreach (var aggregate in aggregatesWithEvents)
        {
            foreach (var domainEvent in aggregate.DomainEvents)
            {
                var outboxEvent = new OutboxEvent
                {
                    Id = Guid.NewGuid(),
                    AggregateId = aggregate.Id,
                    AggregateType = nameof(OnboardingCase),
                    EventType = domainEvent.GetType().Name,
                    Payload = JsonSerializer.Serialize(domainEvent, domainEvent.GetType(), new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }),
                    OccurredAt = domainEvent.OccurredAt,
                    ProcessedAt = null
                };
                OutboxEvents.Add(outboxEvent);
            }
        }

        // Save everything in one transaction (aggregate changes + outbox events)
        var result = await base.SaveChangesAsync(cancellationToken);

        // Clear domain events after successful save
        foreach (var aggregate in aggregatesWithEvents)
        {
            aggregate.ClearDomainEvents();
        }

        return result;
    }

}

/// <summary>
/// Outbox event for transactional outbox pattern
/// </summary>
public class OutboxEvent
{
    public Guid Id { get; set; }
    public Guid AggregateId { get; set; }
    public string AggregateType { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

