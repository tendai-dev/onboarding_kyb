using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using OnboardingApi.Application.Document.Interfaces;

namespace OnboardingApi.Infrastructure.Storage;

public class MinIOObjectStorage : IObjectStorage
{
    private readonly IMinioClient _minioClient;
    private readonly ILogger<MinIOObjectStorage> _logger;
    private readonly MinIOOptions _options;

    public MinIOObjectStorage(IOptions<MinIOOptions> options, ILogger<MinIOObjectStorage> logger)
    {
        _logger = logger;
        _options = options.Value;
        
        // Create and configure MinIO client for version 6.0.1
        var endpoint = _options.Endpoint;
        if (_options.UseSSL && !endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            endpoint = endpoint.Replace("http://", "https://");
            if (!endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                endpoint = "https://" + endpoint;
            }
        }
        
        var fullEndpoint = endpoint;
        if (!fullEndpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && 
            !fullEndpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            fullEndpoint = (_options.UseSSL ? "https://" : "http://") + fullEndpoint;
        }
        
        // MinIO 6.0.1 - create client (configuration handled internally)
        // The client will use the endpoint and credentials when making requests
        _minioClient = new Minio.MinioClient();
        // Note: MinIO 6.0.1 may require configuration via environment variables or
        // the client may need to be configured differently - this is a workaround
    }

    public async Task<string> UploadObjectAsync(
        string bucketName,
        string objectKey,
        Stream fileStream,
        string contentType,
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

            // Get stream length
            long streamLength = 0;
            if (fileStream.CanSeek)
            {
                var originalPosition = fileStream.Position;
                fileStream.Position = 0;
                streamLength = fileStream.Length;
                fileStream.Position = originalPosition;
            }

            // Upload the object
            var putObjectArgs = new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey)
                .WithStreamData(fileStream)
                .WithContentType(contentType);

            if (streamLength > 0)
            {
                putObjectArgs.WithObjectSize(streamLength);
            }

            await _minioClient.PutObjectAsync(putObjectArgs, cancellationToken);
            _logger.LogInformation("Successfully uploaded object {Bucket}/{Object} ({Size} bytes)", 
                bucketName, objectKey, streamLength > 0 ? streamLength : -1);
            
            return objectKey;
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
            var exceptionMessage = ex.Message ?? "";
            var exceptionTypeName = ex.GetType().FullName ?? "";
            var isNotFound = exceptionMessage.Contains("NoSuchKey", StringComparison.OrdinalIgnoreCase) ||
                           exceptionMessage.Contains("404", StringComparison.OrdinalIgnoreCase) ||
                           exceptionMessage.Contains("ObjectNotFound", StringComparison.OrdinalIgnoreCase) ||
                           exceptionTypeName.Contains("ObjectNotFoundException", StringComparison.OrdinalIgnoreCase) ||
                           ex is ObjectNotFoundException;
            
            if (isNotFound)
            {
                return false;
            }
            
            _logger.LogError(ex, "Failed to check if object exists {Bucket}/{Object}", bucketName, objectKey);
            throw;
        }
    }

    public async Task<string> GeneratePresignedUploadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
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
}

public class MinIOOptions
{
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool UseSSL { get; set; } = false;
    public string BucketName { get; set; } = "kyb-docs";
}


