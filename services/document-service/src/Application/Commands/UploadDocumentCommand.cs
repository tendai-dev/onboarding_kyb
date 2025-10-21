using DocumentService.Domain.Aggregates;
using DocumentService.Domain.ValueObjects;
using FluentValidation;
using MediatR;

namespace DocumentService.Application.Commands;

/// <summary>
/// Complete upload workflow:
/// 1. Check for duplicate (SHA256 hash)
/// 2. Upload to MinIO if new
/// 3. Trigger virus scan
/// 4. Create document record
/// </summary>
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

public class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    private static readonly string[] AllowedContentTypes = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg"
    };

    public UploadDocumentCommandValidator()
    {
        RuleFor(x => x.CaseId).NotEmpty();
        RuleFor(x => x.PartnerId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(ct => AllowedContentTypes.Contains(ct.ToLower()))
            .WithMessage($"Content type must be one of: {string.Join(", ", AllowedContentTypes)}");
        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxFileSizeBytes)
            .WithMessage($"File size must not exceed {MaxFileSizeBytes / 1024 / 1024}MB");
        RuleFor(x => x.FileStream).NotNull();
        RuleFor(x => x.UploadedBy).NotEmpty();
    }
}

