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
            
            entity.Property(e => e.ApplicationId)
                .HasColumnName("application_id");
            
            entity.Property(e => e.ThreadId)
                .HasColumnName("thread_id");
            
            entity.Property(e => e.SenderId)
                .IsRequired()
                .HasColumnName("sender_id");
            
            entity.Property(e => e.SenderName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("sender_name");
            
            entity.Property(e => e.SenderRole)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("sender_role");
            
            entity.Property(e => e.Content)
                .IsRequired()
                .HasMaxLength(4000)
                .HasColumnName("content");
            
            entity.Property(e => e.SentAt)
                .IsRequired()
                .HasColumnName("sent_at");
            
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasColumnName("status");

            // Indexes
            entity.HasIndex(e => e.ApplicationId);
            entity.HasIndex(e => e.ThreadId);
        });
    }
}

