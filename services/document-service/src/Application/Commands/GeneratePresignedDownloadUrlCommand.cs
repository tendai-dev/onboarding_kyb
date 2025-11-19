using MediatR;

namespace DocumentService.Application.Commands;

public record GeneratePresignedDownloadUrlCommand(
    string StorageKey,
    string BucketName = "kyb-docs"  // Default to configured bucket name
) : IRequest<GeneratePresignedDownloadUrlResult>;

public record GeneratePresignedDownloadUrlResult(
    string DownloadUrl,
    DateTime ExpiresAt
);
