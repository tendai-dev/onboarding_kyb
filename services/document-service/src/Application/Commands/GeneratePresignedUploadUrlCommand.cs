using FluentValidation;
using MediatR;
using DocumentService.Domain.Aggregates;

namespace DocumentService.Application.Commands;

/// <summary>
/// Command to generate presigned URL for document upload to MinIO/S3
/// </summary>
public record GeneratePresignedUploadUrlCommand : IRequest<GeneratePresignedUploadUrlResult>
{
    public Guid CaseId { get; init; }
    public DocumentType DocumentType { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
}

public record GeneratePresignedUploadUrlResult(
    Guid DocumentId,
    string UploadUrl,
    string StorageKey,
    DateTime ExpiresAt,
    Dictionary<string, string> RequiredHeaders
);

public class GeneratePresignedUploadUrlValidator : AbstractValidator<GeneratePresignedUploadUrlCommand>
{
    private static readonly string[] AllowedContentTypes = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB
    
    public GeneratePresignedUploadUrlValidator()
    {
        RuleFor(x => x.CaseId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(ct => AllowedContentTypes.Contains(ct.ToLower()))
            .WithMessage($"Content type must be one of: {string.Join(", ", AllowedContentTypes)}");
        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxFileSizeBytes)
            .WithMessage($"File size must not exceed {MaxFileSizeBytes / 1024 / 1024}MB");
    }
}

