using DocumentService.Domain.Aggregates;
using FluentValidation;
using MediatR;

namespace DocumentService.Application.Commands;

/// <summary>
/// Bulk import documents from legacy systems
/// Supports CSV/Excel with metadata mapping and audit trail
/// </summary>
public record BulkImportDocumentsCommand : IRequest<BulkImportResult>
{
    public Guid ImportBatchId { get; init; }
    public string ImportSource { get; init; } = string.Empty;
    public List<DocumentImportEntry> Documents { get; init; } = new();
    public string ImportedBy { get; init; } = string.Empty;
    public Dictionary<string, string> Metadata { get; init; } = new();
}

public record DocumentImportEntry
{
    public Guid CaseId { get; init; }
    public DocumentType Type { get; init; }
    public string LegacyDocumentId { get; init; } = string.Empty;
    public string FilePath { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public Dictionary<string, string> Metadata { get; init; } = new();
}

public record BulkImportResult
{
    public Guid ImportBatchId { get; init; }
    public int TotalDocuments { get; init; }
    public int SuccessCount { get; init; }
    public int FailureCount { get; init; }
    public int DuplicateCount { get; init; }
    public List<ImportError> Errors { get; init; } = new();
    public DateTime StartedAt { get; init; }
    public DateTime CompletedAt { get; init; }
}

public record ImportError
{
    public string LegacyDocumentId { get; init; } = string.Empty;
    public string ErrorMessage { get; init; } = string.Empty;
    public string FilePath { get; init; } = string.Empty;
}

public class BulkImportDocumentsCommandValidator : AbstractValidator<BulkImportDocumentsCommand>
{
    public BulkImportDocumentsCommandValidator()
    {
        RuleFor(x => x.ImportBatchId).NotEmpty();
        RuleFor(x => x.ImportSource).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Documents).NotEmpty().WithMessage("At least one document required");
        RuleFor(x => x.Documents.Count).LessThanOrEqualTo(1000)
            .WithMessage("Maximum 1000 documents per batch");
        RuleFor(x => x.ImportedBy).NotEmpty();
        
        RuleForEach(x => x.Documents).SetValidator(new DocumentImportEntryValidator());
    }
}

public class DocumentImportEntryValidator : AbstractValidator<DocumentImportEntry>
{
    public DocumentImportEntryValidator()
    {
        RuleFor(x => x.CaseId).NotEmpty();
        RuleFor(x => x.LegacyDocumentId).NotEmpty().MaximumLength(255);
        RuleFor(x => x.FilePath).NotEmpty().MaximumLength(1024);
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
    }
}

