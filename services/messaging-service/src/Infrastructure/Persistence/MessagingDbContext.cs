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
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("sender_role");
            
            entity.Property(e => e.Content)
                .IsRequired()
                .HasMaxLength(4000)
                .HasColumnName("content");
            
            entity.Property(e => e.Type)
                .HasConversion<string>()
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("type");
            
            entity.Property(e => e.SentAt)
                .IsRequired()
                .HasColumnName("sent_at");
            
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasColumnName("status");
            
            entity.Property(e => e.ReplyToMessageId)
                .HasColumnName("reply_to_message_id");
            
            entity.Property(e => e.ReadAt)
                .HasColumnName("read_at");
            
            entity.Property(e => e.DeletedAt)
                .HasColumnName("deleted_at");
            
            entity.Property(e => e.IsStarred)
                .IsRequired()
                .HasColumnName("is_starred")
                .HasDefaultValue(false);
            
            entity.Property(e => e.ReceiverId)
                .HasColumnName("receiver_id");
            
            entity.Property(e => e.ReceiverName)
                .HasMaxLength(200)
                .HasColumnName("receiver_name");

            // Configure attachments relationship
            entity.OwnsMany(e => e.Attachments, attachment =>
            {
                attachment.ToTable("message_attachments");
                attachment.HasKey(a => a.Id);
                attachment.Property(a => a.Id).HasColumnName("id");
                attachment.Property(a => a.MessageId).HasColumnName("message_id").IsRequired();
                attachment.Property(a => a.FileName).HasColumnName("file_name").IsRequired().HasMaxLength(500);
                attachment.Property(a => a.ContentType).HasColumnName("content_type").IsRequired().HasMaxLength(200);
                attachment.Property(a => a.FileSizeBytes).HasColumnName("file_size_bytes").IsRequired();
                attachment.Property(a => a.StorageKey).HasColumnName("storage_key").IsRequired().HasMaxLength(1000);
                attachment.Property(a => a.StorageUrl).HasColumnName("storage_url").HasMaxLength(2000);
                attachment.Property(a => a.DocumentId).HasColumnName("document_id");
                attachment.Property(a => a.Description).HasColumnName("description").HasMaxLength(1000);
                attachment.Property(a => a.UploadedAt).HasColumnName("uploaded_at").IsRequired();
            });

            // Indexes
            entity.HasIndex(e => e.ApplicationId);
            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.ReplyToMessageId);
            entity.HasIndex(e => e.IsStarred);
        });
    }
}

