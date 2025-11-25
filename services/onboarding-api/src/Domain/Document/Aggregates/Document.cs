using OnboardingApi.Domain.Document.Events;
using OnboardingApi.Domain.Document.ValueObjects;

namespace OnboardingApi.Domain.Document.Aggregates;

/// <summary>
/// Document Aggregate Root
/// Represents an uploaded document with metadata and verification status
/// </summary>
public class Document
{
    private readonly List<IDomainEvent> _domainEvents = new();

    public Guid Id { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public Guid CaseId { get; set; }
    public Guid PartnerId { get; set; }
    public DocumentType Type { get; set; }
    public DocumentStatus Status { get; set; }
    
    // Storage
    public string StorageKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    
    // Metadata
    public DocumentMetadata Metadata { get; set; } = null!;
    
    // Verification
    public bool IsVirusScanned { get; set; }
    public bool IsVirusClean { get; set; }
    public DateTime? VirusScannedAt { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }
    public string? RejectionReason { get; set; }
    
    // Audit
    public DateTime UploadedAt { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    private Document() { }
    
    public static Document Create(
        Guid caseId,
        Guid partnerId,
        DocumentType type,
        string fileName,
        string contentType,
        long sizeBytes,
        string storageKey,
        string bucketName,
        DocumentMetadata metadata,
        string uploadedBy)
    {
        var document = new Document
        {
            Id = Guid.NewGuid(),
            DocumentNumber = GenerateDocumentNumber(),
            CaseId = caseId,
            PartnerId = partnerId,
            Type = type,
            Status = DocumentStatus.Uploaded,
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            StorageKey = storageKey,
            BucketName = bucketName,
            Metadata = metadata,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = uploadedBy,
            IsVirusScanned = false,
            IsVirusClean = false,
            IsVerified = false
        };
        
        document.AddDomainEvent(new DocumentUploadedEvent(
            document.Id,
            document.CaseId,
            document.Type.ToString(),
            document.FileName,
            DateTime.UtcNow
        ));
        
        return document;
    }
    
    public void MarkVirusScanned(bool isClean)
    {
        IsVirusScanned = true;
        IsVirusClean = isClean;
        VirusScannedAt = DateTime.UtcNow;
        
        if (!isClean)
        {
            Status = DocumentStatus.Rejected;
            RejectionReason = "Virus detected";
            
            AddDomainEvent(new DocumentRejectedEvent(
                Id,
                CaseId,
                "Virus detected",
                DateTime.UtcNow
            ));
        }
        else
        {
            Status = DocumentStatus.PendingVerification;
            
            AddDomainEvent(new DocumentVirusScannedEvent(
                Id,
                CaseId,
                isClean,
                DateTime.UtcNow
            ));
        }
    }
    
    public void Verify(string verifiedBy)
    {
        if (!IsVirusScanned || !IsVirusClean)
            throw new InvalidOperationException("Document must be virus-scanned and clean before verification");
        
        if (Status != DocumentStatus.PendingVerification)
            throw new InvalidOperationException($"Cannot verify document in status {Status}");
        
        Status = DocumentStatus.Verified;
        IsVerified = true;
        VerifiedAt = DateTime.UtcNow;
        VerifiedBy = verifiedBy;
        
        AddDomainEvent(new DocumentVerifiedEvent(
            Id,
            CaseId,
            Type.ToString(),
            verifiedBy,
            DateTime.UtcNow
        ));
    }
    
    public void Reject(string reason, string rejectedBy)
    {
        if (Status == DocumentStatus.Verified)
            throw new InvalidOperationException("Cannot reject verified document");
        
        Status = DocumentStatus.Rejected;
        RejectionReason = reason;
        VerifiedBy = rejectedBy;
        
        AddDomainEvent(new DocumentRejectedEvent(
            Id,
            CaseId,
            reason,
            DateTime.UtcNow
        ));
    }
    
    public void SetExpiry(DateTime expiresAt)
    {
        if (expiresAt <= DateTime.UtcNow)
            throw new ArgumentException("Expiry date must be in the future");
        
        ExpiresAt = expiresAt;
    }
    
    public bool IsExpired() => ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;
    
    public void ClearDomainEvents() => _domainEvents.Clear();
    
    private void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    
    private static string GenerateDocumentNumber()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Random.Shared.Next(10000, 99999);
        return $"DOC-{datePart}-{randomPart}";
    }
}

