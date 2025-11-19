using DocumentService.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace DocumentService.Infrastructure.Storage;

public class MinIOObjectStorage : IObjectStorage
{
    private readonly IMinioClient _minioClient;
    private readonly ILogger<MinIOObjectStorage> _logger;
    private readonly MinIOOptions _options;

    public MinIOObjectStorage(IMinioClient minioClient, IOptions<MinIOOptions> options, ILogger<MinIOObjectStorage> logger)
    {
        _minioClient = minioClient;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<string> GeneratePresignedUploadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var args = new PresignedPutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithExpiry((int)expiry.TotalSeconds);

            var url = await _minioClient.PresignedPutObjectAsync(args);
            _logger.LogInformation("Generated presigned upload URL for {Bucket}/{Object}", bucketName, objectKey);
            return url ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned upload URL for {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task<string> GeneratePresignedDownloadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var args = new PresignedGetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithExpiry((int)expiry.TotalSeconds);

            var url = await _minioClient.PresignedGetObjectAsync(args);
            _logger.LogInformation("Generated presigned download URL for {Bucket}/{Object}", bucketName, objectKey);
            return url ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned download URL for {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task<bool> ObjectExistsAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var args = new StatObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            await _minioClient.StatObjectAsync(args, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            // Check if this is a "not found" exception - if so, return false instead of throwing
            var exceptionMessage = ex.Message ?? "";
            var exceptionTypeName = ex.GetType().FullName ?? "";
            var isNotFound = exceptionMessage.Contains("NoSuchKey", StringComparison.OrdinalIgnoreCase) ||
                           exceptionMessage.Contains("404", StringComparison.OrdinalIgnoreCase) ||
                           exceptionMessage.Contains("ObjectNotFound", StringComparison.OrdinalIgnoreCase) ||
                           exceptionTypeName.Contains("ObjectNotFoundException", StringComparison.OrdinalIgnoreCase);
            
            if (isNotFound)
            {
                return false;
            }
            
            _logger.LogError(ex, "Failed to check if object exists {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task DeleteObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var args = new RemoveObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            await _minioClient.RemoveObjectAsync(args, cancellationToken);
            _logger.LogInformation("Deleted object {Bucket}/{Object}", bucketName, objectKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete object {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task<ObjectMetadata> GetObjectMetadataAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var args = new StatObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            var stat = await _minioClient.StatObjectAsync(args, cancellationToken);
            
            return new ObjectMetadata(
                SizeBytes: stat.Size,
                ContentType: stat.ContentType,
                LastModified: stat.LastModified,
                CustomMetadata: stat.MetaData ?? new Dictionary<string, string>()
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get object metadata for {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task UploadObjectAsync(
        string bucketName,
        string objectKey,
        Stream data,
        string contentType,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Ensure bucket exists
            var bucketExistsArgs = new BucketExistsArgs().WithBucket(bucketName);
            var bucketExists = await _minioClient.BucketExistsAsync(bucketExistsArgs, cancellationToken);
            
            if (!bucketExists)
            {
                _logger.LogInformation("Bucket {Bucket} does not exist, creating it...", bucketName);
                var makeBucketArgs = new MakeBucketArgs().WithBucket(bucketName);
                await _minioClient.MakeBucketAsync(makeBucketArgs, cancellationToken);
                _logger.LogInformation("Created bucket {Bucket}", bucketName);
            }

            // Prepare metadata
            var objectMetadata = new Dictionary<string, string>();
            if (metadata != null)
            {
                foreach (var kvp in metadata)
                {
                    objectMetadata[kvp.Key] = kvp.Value;
                }
            }

            // Get stream length (may need to seek to end if length is not available)
            long streamLength = 0;
            if (data.CanSeek)
            {
                var originalPosition = data.Position;
                data.Position = 0;
                streamLength = data.Length;
                data.Position = originalPosition;
            }
            else
            {
                // If stream doesn't support seeking, we'll let MinIO handle it
                // by not specifying the size
            }

            // Upload the object
            var putObjectArgs = new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithStreamData(data)
                .WithContentType(contentType);

            if (streamLength > 0)
            {
                putObjectArgs.WithObjectSize(streamLength);
            }

            if (objectMetadata.Count > 0)
            {
                putObjectArgs.WithHeaders(objectMetadata);
            }

            await _minioClient.PutObjectAsync(putObjectArgs, cancellationToken);
            _logger.LogInformation("Successfully uploaded object {Bucket}/{Object} ({Size} bytes)", 
                bucketName, objectKey, streamLength > 0 ? streamLength : -1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload object {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task<Stream> DownloadObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var memoryStream = new MemoryStream();
            var args = new GetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithCallbackStream(stream =>
                {
                    stream.CopyTo(memoryStream);
                });

            await _minioClient.GetObjectAsync(args, cancellationToken);
            memoryStream.Position = 0;
            
            _logger.LogInformation("Downloaded object {Bucket}/{Object}", bucketName, objectKey);
            return memoryStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download object {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }
}

public class MinIOOptions
{
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool UseSSL { get; set; } = false;
    public string BucketName { get; set; } = "kyb-docs";
}
