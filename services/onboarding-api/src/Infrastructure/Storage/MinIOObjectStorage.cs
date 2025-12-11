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
        _options = options.Value ?? throw new ArgumentNullException(nameof(options), "MinIOOptions cannot be null");
        
        // Validate required configuration values
        if (string.IsNullOrWhiteSpace(_options.Endpoint))
        {
            throw new ArgumentException("MinIO Endpoint is required but was null or empty", nameof(_options.Endpoint));
        }
        
        if (string.IsNullOrWhiteSpace(_options.AccessKey))
        {
            throw new ArgumentException("MinIO AccessKey is required but was null or empty", nameof(_options.AccessKey));
        }
        
        if (string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            throw new ArgumentException("MinIO SecretKey is required but was null or empty", nameof(_options.SecretKey));
        }
        
        _logger.LogInformation("Initializing MinIO client with endpoint: {Endpoint}, UseSSL: {UseSSL}", 
            _options.Endpoint, _options.UseSSL);
        
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
        
        // Validate endpoint format
        if (!Uri.TryCreate(fullEndpoint, UriKind.Absolute, out var uri) || uri == null)
        {
            throw new ArgumentException($"Invalid MinIO endpoint format: {fullEndpoint}", nameof(_options.Endpoint));
        }
        
        // Extract host and port
        var host = uri.Host;
        if (string.IsNullOrWhiteSpace(host))
        {
            throw new ArgumentException($"Could not extract host from MinIO endpoint: {fullEndpoint}", nameof(_options.Endpoint));
        }
        
        var port = uri.Port > 0 ? uri.Port : (_options.UseSSL ? 443 : 80);
        
        // MinIO 6.0.1 - Use full URL format for WithEndpoint to ensure internal endpoint string is properly set
        // The IsAmazonEndPoint check requires the endpoint string to be non-null
        // Using full URL format ensures MinIO client stores it correctly internally
        var endpointString = $"{host}:{port}";
        
        _logger.LogInformation("Configuring MinIO client with endpoint: {Endpoint}, host: {Host}, port: {Port}, UseSSL: {UseSSL}, AccessKey: {AccessKeyPresent}", 
            endpointString, host, port, _options.UseSSL, !string.IsNullOrWhiteSpace(_options.AccessKey));
        
        // MinIO 6.0.1: CRITICAL - Must call .Build() to properly initialize the client
        // Without Build(), the endpoint is not stored correctly and IsAmazonEndPoint() fails with null
        var minioClientBuilder = new Minio.MinioClient()
            .WithEndpoint(endpointString)  // Use string format "host:port"
            .WithCredentials(_options.AccessKey, _options.SecretKey);
        
        if (_options.UseSSL)
        {
            minioClientBuilder.WithSSL();
        }
        
        // CRITICAL: Call Build() to properly initialize the MinIO client
        // This ensures the endpoint is stored correctly for IsAmazonEndPoint() check
        _minioClient = minioClientBuilder.Build();
        
        _logger.LogInformation("MinIO client initialized successfully with endpoint: {Endpoint}", endpointString);
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


