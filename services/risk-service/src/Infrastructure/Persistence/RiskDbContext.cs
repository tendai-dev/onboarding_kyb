using RiskService.Domain.Aggregates;
using RiskService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace RiskService.Infrastructure.Persistence;

public class RiskDbContext : DbContext
{
    public RiskDbContext(DbContextOptions<RiskDbContext> options) : base(options)
    {
    }

    public DbSet<RiskAssessment> RiskAssessments { get; set; }
    public DbSet<RiskFactor> RiskFactors { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // RiskAssessment configuration
        modelBuilder.Entity<RiskAssessment>(entity =>
        {
            entity.ToTable("risk_assessments");
            
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

            // Domain events and factors are handled separately (already ignored above)

            // Indexes
            entity.HasIndex(e => e.CaseId).IsUnique();
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OverallRiskLevel);
        });

        // RiskFactor configuration
        modelBuilder.Entity<RiskFactor>(entity =>
        {
            entity.ToTable("risk_factors");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.Value,
                    value => RiskFactorId.From(value))
                .HasColumnName("id");

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("type");

            entity.Property(e => e.Level)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("level");

            entity.Property(e => e.Score)
                .HasPrecision(5, 2)
                .IsRequired()
                .HasColumnName("score");

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnName("description");

            entity.Property(e => e.Source)
                .HasMaxLength(200)
                .HasColumnName("source");

            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");

            // Foreign key to RiskAssessment - store as Guid
            entity.Property<Guid>("RiskAssessmentId")
                .HasColumnName("risk_assessment_id");

            // Indexes
            entity.HasIndex("RiskAssessmentId");
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Level);
        });

        // Relationship between RiskAssessment and RiskFactor
        // Note: We manually load factors in the repository, so we don't configure the relationship
        // The FK is a shadow property that stores Guid, matching the Guid value of RiskAssessment.Id
        // Since we load factors manually, EF Core relationship configuration isn't strictly necessary
        // However, for database integrity, we still want cascade delete
        // We'll handle this via SQL directly or ignore the relationship validation for now
    }
}
