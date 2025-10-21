using NotificationService.Domain.Aggregates;
using NotificationService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace NotificationService.Infrastructure.Persistence;

public class NotificationDbContext : DbContext
{
    public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
    {
    }

    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.Value,
                    value => NotificationId.From(value))
                .HasColumnName("id");

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("type");

            entity.Property(e => e.Channel)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("channel");

            entity.Property(e => e.Recipient)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("recipient");

            entity.Property(e => e.Subject)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("subject");

            entity.Property(e => e.Content)
                .IsRequired()
                .HasColumnType("text")
                .HasColumnName("content");

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");

            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("priority");

            entity.Property(e => e.CaseId)
                .HasMaxLength(100)
                .HasColumnName("case_id");

            entity.Property(e => e.PartnerId)
                .HasMaxLength(100)
                .HasColumnName("partner_id");

            entity.Property(e => e.TemplateId)
                .HasMaxLength(100)
                .HasColumnName("template_id");

            entity.Property(e => e.TemplateData)
                .HasColumnType("jsonb")
                .HasColumnName("template_data");

            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");

            entity.Property(e => e.ScheduledAt)
                .HasColumnName("scheduled_at");

            entity.Property(e => e.SentAt)
                .HasColumnName("sent_at");

            entity.Property(e => e.DeliveredAt)
                .HasColumnName("delivered_at");

            entity.Property(e => e.FailedAt)
                .HasColumnName("failed_at");

            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(2000)
                .HasColumnName("error_message");

            entity.Property(e => e.RetryCount)
                .IsRequired()
                .HasColumnName("retry_count");

            entity.Property(e => e.MaxRetries)
                .IsRequired()
                .HasColumnName("max_retries");

            // Ignore domain events
            entity.Ignore(e => e.DomainEvents);

            // Indexes
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Channel);
            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ScheduledAt);
            entity.HasIndex(e => new { e.Status, e.ScheduledAt });
        });
    }
}
