using MediatR;
using OnboardingApi.Application.Document.Interfaces;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;

namespace OnboardingApi.Application.Document.Queries;

public record GetDocumentByIdQuery(Guid DocumentId) : IRequest<DocumentDto?>;

public record GetDocumentsByCaseQuery(Guid CaseId) : IRequest<List<DocumentDto>>;

public record GetAllDocumentsQuery(int Skip = 0, int Take = 100) : IRequest<PagedDocumentsResult>;

public class GetDocumentByIdQueryHandler : IRequestHandler<GetDocumentByIdQuery, DocumentDto?>
{
    private readonly IDocumentRepository _repository;

    public GetDocumentByIdQueryHandler(IDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task<DocumentDto?> Handle(GetDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        var document = await _repository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document == null)
            return null;

        return DocumentQueryHelpers.MapToDto(document);
    }
}

public class GetDocumentsByCaseQueryHandler : IRequestHandler<GetDocumentsByCaseQuery, List<DocumentDto>>
{
    private readonly IDocumentRepository _repository;

    public GetDocumentsByCaseQueryHandler(IDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<DocumentDto>> Handle(GetDocumentsByCaseQuery request, CancellationToken cancellationToken)
    {
        var documents = await _repository.GetByCaseIdAsync(request.CaseId, cancellationToken);
        return documents.Select(DocumentQueryHelpers.MapToDto).ToList();
    }
}

public class GetAllDocumentsQueryHandler : IRequestHandler<GetAllDocumentsQuery, PagedDocumentsResult>
{
    private readonly IDocumentRepository _repository;

    public GetAllDocumentsQueryHandler(IDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedDocumentsResult> Handle(GetAllDocumentsQuery request, CancellationToken cancellationToken)
    {
        var documents = await _repository.GetAllAsync(request.Skip, request.Take, cancellationToken);
        var total = await _repository.GetCountAsync(cancellationToken);

        return new PagedDocumentsResult
        {
            Items = documents.Select(DocumentQueryHelpers.MapToDto).ToList(),
            TotalCount = total,
            Skip = request.Skip,
            Take = request.Take
        };
    }
}

internal static class DocumentQueryHelpers
{
    public static DocumentDto MapToDto(DomainDocument document)
    {
        return new DocumentDto
    {
        Id = document.Id,
        DocumentNumber = document.DocumentNumber,
        CaseId = document.CaseId,
        PartnerId = document.PartnerId,
        Type = document.Type.ToString(),
        Status = document.Status.ToString(),
        FileName = document.FileName,
        ContentType = document.ContentType,
        SizeBytes = document.SizeBytes,
        StorageKey = document.StorageKey,
        BucketName = document.BucketName,
        IsVirusScanned = document.IsVirusScanned,
        IsVirusClean = document.IsVirusClean,
        VirusScannedAt = document.VirusScannedAt,
        IsVerified = document.IsVerified,
        VerifiedAt = document.VerifiedAt,
        VerifiedBy = document.VerifiedBy,
        RejectionReason = document.RejectionReason,
        UploadedAt = document.UploadedAt,
        UploadedBy = document.UploadedBy,
        ExpiresAt = document.ExpiresAt,
        Metadata = new DocumentMetadataDto
        {
            Description = document.Metadata.Description,
            Tags = document.Metadata.Tags,
            IssueDate = document.Metadata.IssueDate,
            ExpiryDate = document.Metadata.ExpiryDate,
            IssuingAuthority = document.Metadata.IssuingAuthority,
            DocumentNumber = document.Metadata.DocumentNumber,
            Country = document.Metadata.Country
        }
    };
    }
}

public class DocumentDto
{
    public Guid Id { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public Guid CaseId { get; set; }
    public Guid PartnerId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public bool IsVirusScanned { get; set; }
    public bool IsVirusClean { get; set; }
    public DateTime? VirusScannedAt { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime UploadedAt { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public DocumentMetadataDto Metadata { get; set; } = new();
}

public class DocumentMetadataDto
{
    public string? Description { get; set; }
    public Dictionary<string, string> Tags { get; set; } = new();
    public string? IssueDate { get; set; }
    public string? ExpiryDate { get; set; }
    public string? IssuingAuthority { get; set; }
    public string? DocumentNumber { get; set; }
    public string? Country { get; set; }
}

public class PagedDocumentsResult
{
    public List<DocumentDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)Take);
    public bool HasNextPage => Skip + Take < TotalCount;
    public bool HasPreviousPage => Skip > 0;
}

