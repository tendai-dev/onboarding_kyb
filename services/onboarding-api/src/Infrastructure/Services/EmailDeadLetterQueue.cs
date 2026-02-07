using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Database-backed dead letter queue for failed emails.
/// Stores failed emails for later retry by a background service.
/// </summary>
public class EmailDeadLetterQueue : IEmailDeadLetterQueue
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDeadLetterQueue> _logger;

    public EmailDeadLetterQueue(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailDeadLetterQueue> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task EnqueueAsync(FailedEmailMessage message, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<EmailQueueDbContext>();

        var entity = new FailedEmailEntity
        {
            Id = message.Id,
            ToAddress = message.To,
            Subject = message.Subject,
            Content = message.Content,
            IsHtml = message.IsHtml,
            CreatedAt = message.CreatedAt,
            LastAttemptAt = message.LastAttemptAt,
            RetryCount = message.RetryCount,
            LastError = message.LastError,
            Status = EmailQueueStatus.Pending
        };

        await context.FailedEmails.AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        _logger.LogDebug("Enqueued failed email {Id} to {To}", message.Id, message.To);
    }

    public async Task<List<FailedEmailMessage>> DequeueAsync(int batchSize = 10, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<EmailQueueDbContext>();

        // Get pending emails that haven't exceeded max retries
        var entities = await context.FailedEmails
            .Where(e => e.Status == EmailQueueStatus.Pending && e.RetryCount < 5)
            .OrderBy(e => e.CreatedAt)
            .Take(batchSize)
            .ToListAsync(cancellationToken);

        // Mark as processing to prevent duplicate processing
        foreach (var entity in entities)
        {
            entity.Status = EmailQueueStatus.Processing;
            entity.LastAttemptAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);

        return entities.Select(e => new FailedEmailMessage
        {
            Id = e.Id,
            To = e.ToAddress,
            Subject = e.Subject,
            Content = e.Content,
            IsHtml = e.IsHtml,
            CreatedAt = e.CreatedAt,
            LastAttemptAt = e.LastAttemptAt,
            RetryCount = e.RetryCount,
            LastError = e.LastError
        }).ToList();
    }

    public async Task MarkAsProcessedAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<EmailQueueDbContext>();

        var entity = await context.FailedEmails.FindAsync(new object[] { messageId }, cancellationToken);
        if (entity != null)
        {
            entity.Status = EmailQueueStatus.Completed;
            entity.ProcessedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task IncrementRetryCountAsync(Guid messageId, string error, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<EmailQueueDbContext>();

        var entity = await context.FailedEmails.FindAsync(new object[] { messageId }, cancellationToken);
        if (entity != null)
        {
            entity.RetryCount++;
            entity.LastError = error;
            entity.LastAttemptAt = DateTime.UtcNow;

            // If exceeded max retries, mark as failed permanently
            if (entity.RetryCount >= 5)
            {
                entity.Status = EmailQueueStatus.Failed;
                _logger.LogError(
                    "Email {Id} to {To} exceeded max retries. Marked as permanently failed.",
                    messageId, entity.ToAddress);
            }
            else
            {
                entity.Status = EmailQueueStatus.Pending; // Reset for next retry
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

/// <summary>
/// DbContext for email queue persistence
/// </summary>
public class EmailQueueDbContext : DbContext
{
    public EmailQueueDbContext(DbContextOptions<EmailQueueDbContext> options) : base(options) { }

    public DbSet<FailedEmailEntity> FailedEmails => Set<FailedEmailEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("email_queue");

        modelBuilder.Entity<FailedEmailEntity>(entity =>
        {
            entity.ToTable("failed_emails");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ToAddress).HasColumnName("to_address").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Subject).HasColumnName("subject").HasMaxLength(500).IsRequired();
            entity.Property(e => e.Content).HasColumnName("content").IsRequired();
            entity.Property(e => e.IsHtml).HasColumnName("is_html");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.LastAttemptAt).HasColumnName("last_attempt_at");
            entity.Property(e => e.ProcessedAt).HasColumnName("processed_at");
            entity.Property(e => e.RetryCount).HasColumnName("retry_count");
            entity.Property(e => e.LastError).HasColumnName("last_error").HasMaxLength(2000);
            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(50);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}

/// <summary>
/// Entity for failed email persistence
/// </summary>
public class FailedEmailEntity
{
    public Guid Id { get; set; }
    public string ToAddress { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsHtml { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastAttemptAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int RetryCount { get; set; }
    public string? LastError { get; set; }
    public EmailQueueStatus Status { get; set; }
}

public enum EmailQueueStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}
