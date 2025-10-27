using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Commands;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Infrastructure.Persistence.Configurations;

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

    public async Task<bool> SaveEntitiesAsync(CancellationToken cancellationToken = default)
    {
        // Dispatch domain events, create outbox events, etc.
        await SaveChangesAsync(cancellationToken);
        return true;
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

