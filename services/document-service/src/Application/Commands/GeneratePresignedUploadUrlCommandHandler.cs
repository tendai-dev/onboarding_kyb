using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using DocumentService.Application.Interfaces;

namespace DocumentService.Application.Commands;

public class GeneratePresignedUploadUrlCommandHandler : IRequestHandler<GeneratePresignedUploadUrlCommand, GeneratePresignedUploadUrlResult>
{
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<GeneratePresignedUploadUrlCommandHandler> _logger;
    private readonly IConfiguration _configuration;

    public GeneratePresignedUploadUrlCommandHandler(
        IObjectStorage objectStorage,
        IConfiguration configuration,
        ILogger<GeneratePresignedUploadUrlCommandHandler> logger)
    {
        _objectStorage = objectStorage;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GeneratePresignedUploadUrlResult> Handle(GeneratePresignedUploadUrlCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Generating presigned upload URL for file: {FileName}", request.FileName);

            // Generate a unique object key
            var objectKey = $"documents/{request.CaseId}/{Guid.NewGuid()}/{request.FileName}";
            // Use configured bucket name (defaults to "kyb-docs" from configuration)
            var bucketName = _configuration["Storage:BucketName"] ?? "kyb-docs";

            // Generate presigned URL with 1 hour expiry
            var presignedUrl = await _objectStorage.GeneratePresignedUploadUrlAsync(
                bucketName,
                objectKey,
                TimeSpan.FromHours(1),
                new Dictionary<string, string>
                {
                    ["ContentType"] = request.ContentType,
                    ["CaseId"] = request.CaseId.ToString(),
                    ["FileName"] = request.FileName
                },
                cancellationToken);

            _logger.LogInformation("Generated presigned upload URL for file: {FileName}, ObjectKey: {ObjectKey}", 
                request.FileName, objectKey);

            return new GeneratePresignedUploadUrlResult(
                DocumentId: Guid.NewGuid(),
                UploadUrl: presignedUrl,
                StorageKey: objectKey,
                ExpiresAt: DateTime.UtcNow.AddHours(1),
                RequiredHeaders: new Dictionary<string, string>
                {
                    ["Content-Type"] = request.ContentType
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating presigned upload URL for file: {FileName}", request.FileName);
            throw;
        }
    }
}
