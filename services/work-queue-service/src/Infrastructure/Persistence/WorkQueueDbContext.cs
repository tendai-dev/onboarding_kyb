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
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");
            
            entity.Property(e => e.Priority)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("priority");
            
            entity.Property(e => e.AssignedTo)
                .HasColumnName("assigned_to");
            
            entity.Property(e => e.AssignedToName)
                .HasMaxLength(200)
                .HasColumnName("assigned_to_name");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");
            
            entity.Property(e => e.DueDate)
                .HasColumnName("due_date");

            // Indexes
            entity.HasIndex(e => e.ApplicationId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.AssignedTo);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}

