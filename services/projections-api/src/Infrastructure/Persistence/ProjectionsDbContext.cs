using ProjectionsApi.Domain.ReadModels;
using Microsoft.EntityFrameworkCore;

namespace ProjectionsApi.Infrastructure.Persistence;

public class ProjectionsDbContext : DbContext
{
    public ProjectionsDbContext(DbContextOptions<ProjectionsDbContext> options) : base(options)
    {
    }

    public DbSet<OnboardingCaseProjection> OnboardingCases { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // OnboardingCaseProjection configuration
        modelBuilder.Entity<OnboardingCaseProjection>(entity =>
        {
            entity.ToTable("onboarding_case_projections");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.CaseId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("case_id");

            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("type");

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");

            entity.Property(e => e.PartnerId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("partner_id");

            entity.Property(e => e.PartnerName)
                .HasMaxLength(200)
                .HasColumnName("partner_name");

            entity.Property(e => e.PartnerReferenceId)
                .HasMaxLength(100)
                .HasColumnName("partner_reference_id");

            // Applicant Information
            entity.Property(e => e.ApplicantFirstName)
                .HasMaxLength(100)
                .HasColumnName("applicant_first_name");

            entity.Property(e => e.ApplicantLastName)
                .HasMaxLength(100)
                .HasColumnName("applicant_last_name");

            entity.Property(e => e.ApplicantEmail)
                .HasMaxLength(200)
                .HasColumnName("applicant_email");

            entity.Property(e => e.ApplicantPhone)
                .HasMaxLength(50)
                .HasColumnName("applicant_phone");

            entity.Property(e => e.ApplicantDateOfBirth)
                .HasColumnName("applicant_date_of_birth");

            entity.Property(e => e.ApplicantNationality)
                .HasMaxLength(10)
                .HasColumnName("applicant_nationality");

            // Address Information
            entity.Property(e => e.ApplicantAddress)
                .HasMaxLength(500)
                .HasColumnName("applicant_address");

            entity.Property(e => e.ApplicantCity)
                .HasMaxLength(100)
                .HasColumnName("applicant_city");

            entity.Property(e => e.ApplicantCountry)
                .HasMaxLength(10)
                .HasColumnName("applicant_country");

            // Progress Information
            entity.Property(e => e.ProgressPercentage)
                .HasPrecision(5, 2)
                .HasColumnName("progress_percentage");

            entity.Property(e => e.TotalSteps)
                .HasColumnName("total_steps");

            entity.Property(e => e.CompletedSteps)
                .HasColumnName("completed_steps");

            // Checklist Information
            entity.Property(e => e.ChecklistId)
                .HasColumnName("checklist_id");

            entity.Property(e => e.ChecklistStatus)
                .HasMaxLength(50)
                .HasColumnName("checklist_status");

            entity.Property(e => e.ChecklistCompletionPercentage)
                .HasPrecision(5, 2)
                .HasColumnName("checklist_completion_percentage");

            entity.Property(e => e.ChecklistTotalItems)
                .HasColumnName("checklist_total_items");

            entity.Property(e => e.ChecklistCompletedItems)
                .HasColumnName("checklist_completed_items");

            entity.Property(e => e.ChecklistRequiredItems)
                .HasColumnName("checklist_required_items");

            entity.Property(e => e.ChecklistCompletedRequiredItems)
                .HasColumnName("checklist_completed_required_items");

            // Risk Assessment Information
            entity.Property(e => e.RiskAssessmentId)
                .HasColumnName("risk_assessment_id");

            entity.Property(e => e.RiskLevel)
                .HasMaxLength(50)
                .HasColumnName("risk_level");

            entity.Property(e => e.RiskScore)
                .HasPrecision(5, 2)
                .HasColumnName("risk_score");

            entity.Property(e => e.RiskStatus)
                .HasMaxLength(50)
                .HasColumnName("risk_status");

            entity.Property(e => e.RiskFactorCount)
                .HasColumnName("risk_factor_count");

            // Document Information
            entity.Property(e => e.DocumentCount)
                .HasColumnName("document_count");

            entity.Property(e => e.VerifiedDocumentCount)
                .HasColumnName("verified_document_count");

            entity.Property(e => e.PendingDocumentCount)
                .HasColumnName("pending_document_count");

            entity.Property(e => e.RejectedDocumentCount)
                .HasColumnName("rejected_document_count");

            // Timestamps
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");

            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");

            entity.Property(e => e.SubmittedAt)
                .HasColumnName("submitted_at");

            entity.Property(e => e.ApprovedAt)
                .HasColumnName("approved_at");

            entity.Property(e => e.RejectedAt)
                .HasColumnName("rejected_at");

            // Assignment Information
            entity.Property(e => e.AssignedTo)
                .HasMaxLength(200)
                .HasColumnName("assigned_to");

            entity.Property(e => e.AssignedToName)
                .HasMaxLength(200)
                .HasColumnName("assigned_to_name");

            entity.Property(e => e.AssignedAt)
                .HasColumnName("assigned_at");

            // Compliance Information
            entity.Property(e => e.RequiresManualReview)
                .HasColumnName("requires_manual_review");

            entity.Property(e => e.HasComplianceIssues)
                .HasColumnName("has_compliance_issues");

            entity.Property(e => e.ComplianceNotes)
                .HasMaxLength(2000)
                .HasColumnName("compliance_notes");

            // Ignore calculated properties
            entity.Ignore(e => e.StatusBadgeColor);
            entity.Ignore(e => e.RiskBadgeColor);
            entity.Ignore(e => e.IsOverdue);
            entity.Ignore(e => e.IsHighPriority);
            entity.Ignore(e => e.DaysInProgress);

            // Indexes for performance
            entity.HasIndex(e => e.CaseId).IsUnique();
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.RiskLevel);
            entity.HasIndex(e => e.AssignedTo);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.UpdatedAt);
            entity.HasIndex(e => e.RequiresManualReview);
            entity.HasIndex(e => e.HasComplianceIssues);
            
            // Composite indexes for common queries
            entity.HasIndex(e => new { e.PartnerId, e.Status, e.CreatedAt });
            entity.HasIndex(e => new { e.Status, e.RiskLevel, e.CreatedAt });
            entity.HasIndex(e => new { e.AssignedTo, e.Status, e.CreatedAt });
        });
    }
}
