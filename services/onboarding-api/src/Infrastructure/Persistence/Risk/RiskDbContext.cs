using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;

namespace OnboardingApi.Infrastructure.Persistence.Risk;

public class RiskDbContext : DbContext
{
    public RiskDbContext(DbContextOptions<RiskDbContext> options) : base(options)
    {
    }

    public DbSet<RiskAssessment> RiskAssessments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Use risk schema for separation
        modelBuilder.HasDefaultSchema("risk");

        // RiskAssessment configuration
        modelBuilder.Entity<RiskAssessment>(entity =>
        {
            entity.ToTable("risk_assessments", "risk");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.Value,
                    value => RiskAssessmentId.From(value))
                .HasColumnName("id");

            entity.Property(e => e.CaseId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("case_id");

            entity.Property(e => e.PartnerId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("partner_id");

            entity.Property(e => e.OverallRiskLevel)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("overall_risk_level");

            entity.Property(e => e.RiskScore)
                .HasPrecision(5, 2)
                .IsRequired()
                .HasColumnName("risk_score");

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");

            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");

            entity.Property(e => e.CompletedAt)
                .HasColumnName("completed_at");

            entity.Property(e => e.AssessedBy)
                .HasMaxLength(200)
                .HasColumnName("assessed_by");

            entity.Property(e => e.Notes)
                .HasMaxLength(2000)
                .HasColumnName("notes");

            // Configure Factors as owned collection
            entity.OwnsMany(e => e.Factors, factor =>
            {
                factor.ToTable("risk_factors", "risk");
                factor.HasKey(f => f.Id);
                factor.Property(f => f.Id)
                    .HasConversion(
                        id => id.Value,
                        value => RiskFactorId.From(value))
                    .HasColumnName("id");
                factor.Property(f => f.Type).HasConversion<string>().IsRequired().HasMaxLength(50).HasColumnName("type");
                factor.Property(f => f.Level).HasConversion<string>().IsRequired().HasMaxLength(50).HasColumnName("level");
                factor.Property(f => f.Score).HasPrecision(5, 2).IsRequired().HasColumnName("score");
                factor.Property(f => f.Description).IsRequired().HasMaxLength(1000).HasColumnName("description");
                factor.Property(f => f.Source).HasMaxLength(200).HasColumnName("source");
                factor.Property(f => f.CreatedAt).IsRequired().HasColumnName("created_at");
                factor.Property(f => f.UpdatedAt).HasColumnName("updated_at");
            });

            // Ignore domain events
            entity.Ignore(e => e.DomainEvents);

            // Indexes
            entity.HasIndex(e => e.CaseId).IsUnique();
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OverallRiskLevel);
        });
    }
}

