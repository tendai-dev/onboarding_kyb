using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Messaging.Aggregates;

namespace OnboardingApi.Infrastructure.Persistence.Messaging;

public class MessagingDbContext : DbContext
{
    public MessagingDbContext(DbContextOptions<MessagingDbContext> options) : base(options)
    {
    }

    public DbSet<Message> Messages { get; set; } = null!;
    public DbSet<MessageThread> MessageThreads { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Use messaging schema for separation
        modelBuilder.HasDefaultSchema("messaging");

        // MessageThread configuration
        modelBuilder.Entity<MessageThread>(entity =>
        {
            entity.ToTable("message_threads", "messaging");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            
            entity.Property(e => e.ApplicationId)
                .IsRequired()
                .HasColumnName("application_id");
            
            entity.Property(e => e.ApplicationReference)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("application_reference");
            
            entity.Property(e => e.ApplicantId)
                .IsRequired()
                .HasColumnName("applicant_id");
            
            entity.Property(e => e.ApplicantName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("applicant_name");
            
            entity.Property(e => e.AssignedAdminId)
                .HasColumnName("assigned_admin_id");
            
            entity.Property(e => e.AssignedAdminName)
                .HasMaxLength(200)
                .HasColumnName("assigned_admin_name");
            
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("is_active");
            
            entity.Property(e => e.IsArchived)
                .IsRequired()
                .HasColumnName("is_archived");
            
            entity.Property(e => e.IsStarred)
                .IsRequired()
                .HasColumnName("is_starred");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.ClosedAt)
                .HasColumnName("closed_at");
            
            entity.Property(e => e.LastMessageAt)
                .IsRequired()
                .HasColumnName("last_message_at");
            
            entity.Property(e => e.MessageCount)
                .IsRequired()
                .HasColumnName("message_count");
            
            entity.Property(e => e.UnreadCountApplicant)
                .IsRequired()
                .HasColumnName("unread_count_applicant");
            
            entity.Property(e => e.UnreadCountAdmin)
                .IsRequired()
                .HasColumnName("unread_count_admin");

            entity.HasIndex(e => e.ApplicationId).IsUnique();
            entity.HasIndex(e => e.ApplicantId);
            entity.HasIndex(e => e.AssignedAdminId);
        });

        // Message configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages", "messaging");
            
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            
            entity.Property(e => e.ApplicationId)
                .IsRequired()
                .HasColumnName("application_id");
            
            entity.Property(e => e.ThreadId)
                .IsRequired()
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
                .HasMaxLength(5000)
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
                .IsRequired()
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
                attachment.ToTable("message_attachments", "messaging");
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

            // Ignore domain events
            entity.Ignore(e => e.DomainEvents);

            // Indexes
            entity.HasIndex(e => e.ApplicationId);
            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.SenderId);
            entity.HasIndex(e => e.ReceiverId);
            entity.HasIndex(e => e.ReplyToMessageId);
            entity.HasIndex(e => e.IsStarred);
            entity.HasIndex(e => e.SentAt);
        });
    }
}

