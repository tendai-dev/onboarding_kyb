using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Audit.Aggregates;
using OnboardingApi.Domain.Audit.ValueObjects;

namespace OnboardingApi.Infrastructure.Persistence.Audit;

public class AuditLogDbContext : DbContext
{
    public AuditLogDbContext(DbContextOptions<AuditLogDbContext> options) : base(options)
    {
    }

    public DbSet<AuditLogEntry> AuditLogEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Use audit schema for separation
        modelBuilder.HasDefaultSchema("audit");

        // AuditLogEntry configuration
        modelBuilder.Entity<AuditLogEntry>(entity =>
        {
            entity.ToTable("audit_log_entries", "audit");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.Value,
                    value => AuditLogEntryId.From(value))
                .HasColumnName("id");

            entity.Property(e => e.EventType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("event_type");

            entity.Property(e => e.EntityType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("entity_type");

            entity.Property(e => e.EntityId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("entity_id");

            entity.Property(e => e.CaseId)
                .HasMaxLength(100)
                .HasColumnName("case_id");

            entity.Property(e => e.PartnerId)
                .HasMaxLength(100)
                .HasColumnName("partner_id");

            entity.Property(e => e.UserId)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("user_id");

            entity.Property(e => e.UserRole)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("user_role");

            entity.Property(e => e.Action)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("action");

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(2000)
                .HasColumnName("description");

            entity.Property(e => e.OldValues)
                .HasColumnType("jsonb")
                .HasColumnName("old_values");

            entity.Property(e => e.NewValues)
                .HasColumnType("jsonb")
                .HasColumnName("new_values");

            entity.Property(e => e.IpAddress)
                .IsRequired()
                .HasMaxLength(45) // IPv6 support
                .HasColumnName("ip_address");

            entity.Property(e => e.UserAgent)
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnName("user_agent");

            entity.Property(e => e.Timestamp)
                .IsRequired()
                .HasColumnName("timestamp");

            entity.Property(e => e.CorrelationId)
                .HasMaxLength(100)
                .HasColumnName("correlation_id");

            entity.Property(e => e.Severity)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("severity");

            entity.Property(e => e.ComplianceCategory)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("compliance_category");

            entity.Property(e => e.Hash)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("hash");

            // Indexes for performance and compliance queries
            entity.HasIndex(e => e.EntityType);
            entity.HasIndex(e => e.EntityId);
            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.ComplianceCategory);
            entity.HasIndex(e => e.Severity);
            entity.HasIndex(e => e.CorrelationId);
            
            // Composite indexes for common query patterns
            entity.HasIndex(e => new { e.EntityType, e.EntityId, e.Timestamp });
            entity.HasIndex(e => new { e.CaseId, e.Timestamp });
            entity.HasIndex(e => new { e.UserId, e.Timestamp });
            entity.HasIndex(e => new { e.ComplianceCategory, e.Timestamp });
        });

        // Configure for append-only (no updates/deletes)
        modelBuilder.Entity<AuditLogEntry>()
            .HasQueryFilter(e => true); // Always include all entries
    }

    // Override to prevent updates and deletes for audit integrity
    public override int SaveChanges()
    {
        ValidateAuditIntegrity();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ValidateAuditIntegrity();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void ValidateAuditIntegrity()
    {
        var modifiedEntries = ChangeTracker.Entries<AuditLogEntry>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();

        if (modifiedEntries.Any())
        {
            throw new InvalidOperationException("Audit log entries are immutable and cannot be modified or deleted");
        }
    }
}

