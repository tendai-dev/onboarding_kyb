namespace DocumentService.Application.Interfaces;

/// <summary>
/// Interface for S3-compatible object storage (MinIO)
/// </summary>
public interface IObjectStorage
{
    /// <summary>
    /// Generate presigned URL for upload (PUT)
    /// </summary>
    Task<string> GeneratePresignedUploadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Generate presigned URL for download (GET)
    /// </summary>
    Task<string> GeneratePresignedDownloadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Check if object exists
    /// </summary>
    Task<bool> ObjectExistsAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Delete object
    /// </summary>
    Task DeleteObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get object metadata
    /// </summary>
    Task<ObjectMetadata> GetObjectMetadataAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);
}

public record ObjectMetadata(
    long SizeBytes,
    string ContentType,
    DateTime LastModified,
    Dictionary<string, string> CustomMetadata
);

