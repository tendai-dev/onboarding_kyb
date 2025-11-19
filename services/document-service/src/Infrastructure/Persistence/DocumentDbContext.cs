using DocumentService.Domain.Aggregates;
using DocumentService.Domain.ValueObjects;
using DocumentService.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DocumentService.Infrastructure.Persistence;

public class DocumentDbContext : DbContext, IUnitOfWork
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
            
            // Configure DocumentMetadata as owned entity
            entity.OwnsOne(e => e.Metadata, metadata =>
            {
                metadata.Property(m => m.Description).HasMaxLength(1000);
                metadata.Property(m => m.IssueDate).HasMaxLength(50);
                metadata.Property(m => m.ExpiryDate).HasMaxLength(50);
                metadata.Property(m => m.IssuingAuthority).HasMaxLength(200);
                metadata.Property(m => m.DocumentNumber).HasMaxLength(100);
                metadata.Property(m => m.Country).HasMaxLength(100);
                
                // Configure Tags as JSON
                metadata.Property(m => m.Tags)
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions)null!),
                        v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions)null!) ?? new Dictionary<string, string>()
                    );
            });
        });
    }
}
