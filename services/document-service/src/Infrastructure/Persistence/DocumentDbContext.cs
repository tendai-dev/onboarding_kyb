using DocumentService.Domain.Aggregates;
using Microsoft.EntityFrameworkCore;

namespace DocumentService.Infrastructure.Persistence;

public class DocumentDbContext : DbContext
{
    public DocumentDbContext(DbContextOptions<DocumentDbContext> options) : base(options)
    {
    }

    public DbSet<Document> Documents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure Document entity
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.StorageKey).IsRequired().HasMaxLength(500);
            entity.Property(e => e.BucketName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UploadedBy).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DocumentNumber).IsRequired().HasMaxLength(50);
            
            // Configure value objects as owned entities if they exist
            // This is a simplified configuration
        });
    }
}
