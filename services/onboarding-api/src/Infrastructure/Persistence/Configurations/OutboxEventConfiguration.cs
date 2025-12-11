using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace OnboardingApi.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core entity configuration for OutboxEvent
/// </summary>
public class OutboxEventConfiguration : IEntityTypeConfiguration<OutboxEvent>
{
    public void Configure(EntityTypeBuilder<OutboxEvent> builder)
    {
        builder.ToTable("outbox_events");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(e => e.AggregateId)
            .HasColumnName("aggregate_id")
            .IsRequired();

        builder.HasIndex(e => e.AggregateId);

        builder.Property(e => e.AggregateType)
            .HasColumnName("aggregate_type")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.Payload)
            .HasColumnName("payload")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.OccurredAt)
            .HasColumnName("occurred_at")
            .IsRequired();

        builder.Property(e => e.ProcessedAt)
            .HasColumnName("processed_at");

        builder.HasIndex(e => new { e.ProcessedAt, e.OccurredAt })
            .HasDatabaseName("idx_outbox_processed");
    }
}

