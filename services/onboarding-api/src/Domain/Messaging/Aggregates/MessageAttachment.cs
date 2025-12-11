namespace OnboardingApi.Domain.Messaging.Aggregates;

/// <summary>
/// Message Attachment - represents a file attached to a message
/// </summary>
public class MessageAttachment
{
    public Guid Id { get; private set; }
    public Guid MessageId { get; private set; }
    
    // File information
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    
    // Storage information
    public string StorageKey { get; private set; } = string.Empty; // S3 key, blob path, etc.
    public string StorageUrl { get; private set; } = string.Empty; // Public URL if available
    
    // Document service integration
    public Guid? DocumentId { get; private set; } // Reference to document service if integrated
    
    // Metadata
    public DateTime UploadedAt { get; private set; }
    public string? Description { get; private set; }
    
    private MessageAttachment() { }
    
    public static MessageAttachment Create(
        Guid messageId,
        string fileName,
        string contentType,
        long fileSizeBytes,
        string storageKey,
        string storageUrl,
        Guid? documentId = null,
        string? description = null)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("File name cannot be empty", nameof(fileName));
        
        if (fileSizeBytes <= 0)
            throw new ArgumentException("File size must be greater than zero", nameof(fileSizeBytes));
        
        if (fileSizeBytes > 50 * 1024 * 1024) // 50MB limit
            throw new ArgumentException("File size cannot exceed 50MB", nameof(fileSizeBytes));
        
        return new MessageAttachment
        {
            Id = Guid.NewGuid(),
            MessageId = messageId,
            FileName = fileName,
            ContentType = contentType,
            FileSizeBytes = fileSizeBytes,
            StorageKey = storageKey,
            StorageUrl = storageUrl,
            DocumentId = documentId,
            Description = description,
            UploadedAt = DateTime.UtcNow
        };
    }
    
    public void UpdateStorageUrl(string url)
    {
        StorageUrl = url;
    }
}

