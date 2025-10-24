using Microsoft.EntityFrameworkCore;
using WorkQueueService.Domain.Aggregates;

namespace WorkQueueService.Infrastructure.Persistence;

public class WorkQueueDbContext : DbContext
{
    public WorkQueueDbContext(DbContextOptions<WorkQueueDbContext> options) : base(options)
    {
    }

    public DbSet<WorkItem> WorkItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkItem>(entity =>
        {
            entity.ToTable("work_items");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            
            entity.Property(e => e.CaseId)
                .IsRequired()
                .HasColumnName("case_id");
            
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("title");
            
            entity.Property(e => e.Description)
                .HasMaxLength(2000)
                .HasColumnName("description");
            
            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");
            
            entity.Property(e => e.Priority)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("priority");
            
            entity.Property(e => e.AssigneeId)
                .HasColumnName("assignee_id");
            
            entity.Property(e => e.AssigneeName)
                .HasMaxLength(200)
                .HasColumnName("assignee_name");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");
            
            entity.Property(e => e.DueDate)
                .HasColumnName("due_date");
            
            entity.Property(e => e.CompletedAt)
                .HasColumnName("completed_at");

            // Indexes
            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.AssigneeId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}

