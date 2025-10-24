using Microsoft.EntityFrameworkCore;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Infrastructure.Persistence;

public class MessagingDbContext : DbContext
{
    public MessagingDbContext(DbContextOptions<MessagingDbContext> options) : base(options)
    {
    }

    public DbSet<Message> Messages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            
            entity.Property(e => e.CaseId)
                .HasColumnName("case_id");
            
            entity.Property(e => e.ThreadId)
                .HasColumnName("thread_id");
            
            entity.Property(e => e.FromUserId)
                .IsRequired()
                .HasColumnName("from_user_id");
            
            entity.Property(e => e.FromUserName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("from_user_name");
            
            entity.Property(e => e.FromRole)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("from_role");
            
            entity.Property(e => e.Body)
                .IsRequired()
                .HasMaxLength(4000)
                .HasColumnName("body");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.IsRead)
                .HasColumnName("is_read");
            
            entity.Property(e => e.ReadAt)
                .HasColumnName("read_at");

            // Indexes
            entity.HasIndex(e => e.CaseId);
            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}

