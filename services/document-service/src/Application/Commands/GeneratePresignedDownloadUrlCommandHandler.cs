using MediatR;
using DocumentService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace DocumentService.Application.Commands;

public class GeneratePresignedDownloadUrlCommandHandler : IRequestHandler<GeneratePresignedDownloadUrlCommand, GeneratePresignedDownloadUrlResult>
{
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<GeneratePresignedDownloadUrlCommandHandler> _logger;

    public GeneratePresignedDownloadUrlCommandHandler(IObjectStorage objectStorage, ILogger<GeneratePresignedDownloadUrlCommandHandler> logger)
    {
        _objectStorage = objectStorage;
        _logger = logger;
    }

    public async Task<GeneratePresignedDownloadUrlResult> Handle(GeneratePresignedDownloadUrlCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Generating presigned download URL for {Key}", request.StorageKey);

        var url = await _objectStorage.GeneratePresignedDownloadUrlAsync(
            request.BucketName,
            request.StorageKey,
            TimeSpan.FromHours(1),
            cancellationToken);

        return new GeneratePresignedDownloadUrlResult(
            url,
            DateTime.UtcNow.AddHours(1)
        );
    }
}
