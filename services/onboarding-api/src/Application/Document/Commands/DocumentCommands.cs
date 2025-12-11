using MediatR;
using OnboardingApi.Domain.Document.ValueObjects;

namespace OnboardingApi.Application.Document.Commands;

public record UploadDocumentCommand : IRequest<UploadDocumentResult>
{
    public Guid CaseId { get; init; }
    public Guid PartnerId { get; init; }
    public DocumentType Type { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public Stream FileStream { get; init; } = null!;
    public long FileSizeBytes { get; init; }
    public DocumentMetadata Metadata { get; init; } = null!;
    public string UploadedBy { get; init; } = string.Empty;
}

public record UploadDocumentResult
{
    public Guid DocumentId { get; init; }
    public string DocumentNumber { get; init; } = string.Empty;
    public bool WasDuplicate { get; init; }
    public Guid? ExistingDocumentId { get; init; }
    public string StorageKey { get; init; } = string.Empty;
}

public record GeneratePresignedDownloadUrlCommand(
    string StorageKey,
    string BucketName = "kyb-docs"
) : IRequest<GeneratePresignedDownloadUrlResult>;

public record GeneratePresignedDownloadUrlResult(
    string DownloadUrl,
    DateTime ExpiresAt
);

public record GeneratePresignedUploadUrlCommand(
    string BucketName,
    string ObjectKey,
    string ContentType,
    TimeSpan Expiry
) : IRequest<GeneratePresignedUploadUrlResult>;

public record GeneratePresignedUploadUrlResult(
    string UploadUrl,
    DateTime ExpiresAt
);

public record VerifyDocumentCommand(
    Guid DocumentId,
    string VerifiedBy
) : IRequest<bool>;

public record RejectDocumentCommand(
    Guid DocumentId,
    string Reason,
    string RejectedBy
) : IRequest<bool>;

