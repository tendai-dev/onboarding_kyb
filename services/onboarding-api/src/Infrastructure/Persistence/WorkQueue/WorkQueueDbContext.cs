using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;

namespace OnboardingApi.Infrastructure.Persistence.WorkQueue;

public class WorkQueueDbContext : DbContext
{
    public WorkQueueDbContext(DbContextOptions<WorkQueueDbContext> options) : base(options)
    {
    }

    public DbSet<WorkItem> WorkItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Use work_queue schema for separation
        modelBuilder.HasDefaultSchema("work_queue");

        modelBuilder.Entity<WorkItem>(entity =>
        {
            entity.ToTable("work_items", "work_queue");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            
            entity.Property(e => e.WorkItemNumber)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("work_item_number");
            
            entity.Property(e => e.ApplicationId)
                .IsRequired()
                .HasColumnName("application_id");
            
            entity.Property(e => e.ApplicantName)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("applicant_name");
            
            entity.Property(e => e.EntityType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("entity_type");
            
            entity.Property(e => e.Country)
                .IsRequired()
                .HasMaxLength(3)
                .HasColumnName("country");
            
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");
            
            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("priority");
            
            entity.Property(e => e.RiskLevel)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("risk_level");
            
            entity.Property(e => e.AssignedTo)
                .HasColumnName("assigned_to");
            
            entity.Property(e => e.AssignedToName)
                .HasMaxLength(200)
                .HasColumnName("assigned_to_name");
            
            entity.Property(e => e.AssignedAt)
                .HasColumnName("assigned_at");
            
            entity.Property(e => e.RequiresApproval)
                .IsRequired()
                .HasColumnName("requires_approval");
            
            entity.Property(e => e.ApprovedBy)
                .HasColumnName("approved_by");
            
            entity.Property(e => e.ApprovedByName)
                .HasMaxLength(200)
                .HasColumnName("approved_by_name");
            
            entity.Property(e => e.ApprovedAt)
                .HasColumnName("approved_at");
            
            entity.Property(e => e.ApprovalNotes)
                .HasMaxLength(2000)
                .HasColumnName("approval_notes");
            
            entity.Property(e => e.RejectionReason)
                .HasMaxLength(2000)
                .HasColumnName("rejection_reason");
            
            entity.Property(e => e.RejectedAt)
                .HasColumnName("rejected_at");
            
            entity.Property(e => e.NextRefreshDate)
                .HasColumnName("next_refresh_date");
            
            entity.Property(e => e.LastRefreshedAt)
                .HasColumnName("last_refreshed_at");
            
            entity.Property(e => e.RefreshCount)
                .IsRequired()
                .HasColumnName("refresh_count");
            
            entity.Property(e => e.DueDate)
                .IsRequired()
                .HasColumnName("due_date");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.CreatedBy)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("created_by");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");
            
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(200)
                .HasColumnName("updated_by");

            // Configure Comments as owned collection
            entity.OwnsMany(e => e.Comments, comment =>
            {
                comment.ToTable("work_item_comments", "work_queue");
                comment.HasKey(c => c.Id);
                comment.Property(c => c.Id).HasColumnName("id");
                comment.Property(c => c.WorkItemId).HasColumnName("work_item_id").IsRequired();
                comment.Property(c => c.Text).HasColumnName("text").IsRequired().HasMaxLength(2000);
                comment.Property(c => c.AuthorId).HasColumnName("author_id").IsRequired().HasMaxLength(200);
                comment.Property(c => c.AuthorName).HasColumnName("author_name").IsRequired().HasMaxLength(200);
                comment.Property(c => c.CreatedAt).HasColumnName("created_at").IsRequired();
            });

            // Configure History as owned collection
            entity.OwnsMany(e => e.History, history =>
            {
                history.ToTable("work_item_history", "work_queue");
                history.HasKey(h => h.Id);
                history.Property(h => h.Id).HasColumnName("id");
                history.Property(h => h.WorkItemId).HasColumnName("work_item_id").IsRequired();
                history.Property(h => h.Action).HasColumnName("action").IsRequired().HasMaxLength(500);
                history.Property(h => h.PerformedBy).HasColumnName("performed_by").IsRequired().HasMaxLength(200);
                history.Property(h => h.PerformedAt).HasColumnName("performed_at").IsRequired();
                history.Property(h => h.Status).HasConversion<string>().IsRequired().HasMaxLength(50).HasColumnName("status");
            });

            // Ignore domain events
            entity.Ignore(e => e.DomainEvents);

            // Indexes
            entity.HasIndex(e => e.ApplicationId).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.AssignedTo);
            entity.HasIndex(e => e.RiskLevel);
            entity.HasIndex(e => e.Country);
            entity.HasIndex(e => e.DueDate);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Status, e.AssignedTo });
        });
    }
}

