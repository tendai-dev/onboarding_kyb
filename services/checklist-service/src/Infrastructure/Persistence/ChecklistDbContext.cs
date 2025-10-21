using ChecklistService.Domain.Aggregates;
using ChecklistService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace ChecklistService.Infrastructure.Persistence;

public class ChecklistDbContext : DbContext
{
    public ChecklistDbContext(DbContextOptions<ChecklistDbContext> options) : base(options)
    {
    }

    public DbSet<Checklist> Checklists { get; set; }
    public DbSet<ChecklistItem> ChecklistItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Checklist configuration
        modelBuilder.Entity<Checklist>(entity =>
        {
            entity.ToTable("checklists");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.Value,
                    value => ChecklistId.From(value))
                .HasColumnName("id");

            entity.Property(e => e.CaseId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("case_id");

            entity.Property(e => e.Type)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("type");

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("status");

            entity.Property(e => e.PartnerId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("partner_id");

            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");

            entity.Property(e => e.CompletedAt)
                .HasColumnName("completed_at");

            // Ignore domain events and items (handled separately)
            entity.Ignore(e => e.DomainEvents);
            entity.Ignore(e => e.Items);

            // Indexes
            entity.HasIndex(e => e.CaseId).IsUnique();
            entity.HasIndex(e => e.PartnerId);
            entity.HasIndex(e => e.Status);
        });

        // ChecklistItem configuration
        modelBuilder.Entity<ChecklistItem>(entity =>
        {
            entity.ToTable("checklist_items");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.Value,
                    value => ChecklistItemId.From(value))
                .HasColumnName("id");

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("name");

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnName("description");

            entity.Property(e => e.Category)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("category");

            entity.Property(e => e.IsRequired)
                .IsRequired()
                .HasColumnName("is_required");

            entity.Property(e => e.Order)
                .IsRequired()
                .HasColumnName("order");

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

            entity.Property(e => e.CompletedBy)
                .HasMaxLength(200)
                .HasColumnName("completed_by");

            entity.Property(e => e.Notes)
                .HasMaxLength(2000)
                .HasColumnName("notes");

            entity.Property(e => e.SkipReason)
                .HasMaxLength(1000)
                .HasColumnName("skip_reason");

            // Foreign key to Checklist
            entity.Property<Guid>("ChecklistId")
                .HasColumnName("checklist_id");

            // Indexes
            entity.HasIndex("ChecklistId");
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Category);
        });

        // Relationship between Checklist and ChecklistItem
        modelBuilder.Entity<Checklist>()
            .HasMany<ChecklistItem>()
            .WithOne()
            .HasForeignKey("ChecklistId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
