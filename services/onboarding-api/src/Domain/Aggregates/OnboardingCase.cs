using OnboardingApi.Domain.Events;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Domain.Aggregates;

/// <summary>
/// Onboarding Case Aggregate Root
/// Represents a partner/business onboarding journey
/// </summary>
public class OnboardingCase
{
    private readonly List<IDomainEvent> _domainEvents = new();
    
    public Guid Id { get; private set; }
    public string CaseNumber { get; private set; } = string.Empty;
    public OnboardingType Type { get; private set; }
    public OnboardingStatus Status { get; private set; }
    public Guid PartnerId { get; private set; }
    public string PartnerReferenceId { get; private set; } = string.Empty;
    
    // Entity details
    public ApplicantDetails Applicant { get; private set; } = null!;
    public BusinessDetails? Business { get; private set; }
    
    // Workflow tracking
    public List<DocumentRequest> DocumentRequests { get; private set; } = new();
    public List<ChecklistItem> ChecklistItems { get; private set; } = new();
    
    // Audit
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public string? UpdatedBy { get; private set; }
    
    // Metadata
    public Dictionary<string, string> Metadata { get; private set; } = new();
    
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    // Private constructor for EF Core
    private OnboardingCase() { }
    
    /// <summary>
    /// Create a new onboarding case
    /// </summary>
    public static OnboardingCase Create(
        OnboardingType type,
        Guid partnerId,
        string partnerReferenceId,
        ApplicantDetails applicant,
        BusinessDetails? business,
        string createdBy)
    {
        var caseEntity = new OnboardingCase
        {
            Id = Guid.NewGuid(),
            CaseNumber = GenerateCaseNumber(),
            Type = type,
            Status = OnboardingStatus.Draft,
            PartnerId = partnerId,
            PartnerReferenceId = partnerReferenceId,
            Applicant = applicant,
            Business = business,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
        
        caseEntity.AddDomainEvent(new OnboardingCaseCreatedEvent(
            caseEntity.Id,
            caseEntity.CaseNumber,
            caseEntity.Type,
            caseEntity.PartnerId,
            caseEntity.PartnerReferenceId,
            DateTime.UtcNow
        ));
        
        return caseEntity;
    }
    
    /// <summary>
    /// Submit case for processing
    /// </summary>
    public void Submit(string submittedBy)
    {
        if (Status != OnboardingStatus.Draft)
            throw new InvalidOperationException($"Cannot submit case in status {Status}");
        
        if (!Applicant.IsComplete())
            throw new InvalidOperationException("Applicant details are incomplete");
        
        if (Type == OnboardingType.Business && (Business == null || !Business.IsComplete()))
            throw new InvalidOperationException("Business details are incomplete for KYB onboarding");
        
        Status = OnboardingStatus.Submitted;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = submittedBy;
        
        // Include metadata and details in event for downstream services
        AddDomainEvent(new OnboardingCaseSubmittedEvent(
            Id,
            CaseNumber,
            Type,
            PartnerId,
            DateTime.UtcNow,
            Metadata: Metadata.Count > 0 ? new Dictionary<string, string>(Metadata) : null,
            Applicant: Applicant,
            Business: Business
        ));
    }
    
    /// <summary>
    /// Update applicant details
    /// </summary>
    public void UpdateApplicant(ApplicantDetails newDetails, string updatedBy)
    {
        if (Status == OnboardingStatus.Approved || Status == OnboardingStatus.Rejected)
            throw new InvalidOperationException($"Cannot update applicant in status {Status}");
        
        Applicant = newDetails;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        
        AddDomainEvent(new OnboardingCaseUpdatedEvent(
            Id,
            CaseNumber,
            "ApplicantDetails",
            DateTime.UtcNow
        ));
    }
    
    /// <summary>
    /// Update business details (KYB only)
    /// </summary>
    public void UpdateBusiness(BusinessDetails newDetails, string updatedBy)
    {
        if (Type != OnboardingType.Business)
            throw new InvalidOperationException("Cannot update business details for non-business onboarding");
        
        if (Status == OnboardingStatus.Approved || Status == OnboardingStatus.Rejected)
            throw new InvalidOperationException($"Cannot update business in status {Status}");
        
        Business = newDetails;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = updatedBy;
        
        AddDomainEvent(new OnboardingCaseUpdatedEvent(
            Id,
            CaseNumber,
            "BusinessDetails",
            DateTime.UtcNow
        ));
    }
    
    /// <summary>
    /// Approve the onboarding case
    /// </summary>
    public void Approve(string approvedBy, string? notes = null)
    {
        if (Status != OnboardingStatus.UnderReview)
            throw new InvalidOperationException($"Cannot approve case in status {Status}");
        
        Status = OnboardingStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = approvedBy;
        
        if (notes != null)
            Metadata["approval_notes"] = notes;
        
        AddDomainEvent(new OnboardingCaseApprovedEvent(
            Id,
            CaseNumber,
            PartnerId,
            approvedBy,
            DateTime.UtcNow
        ));
    }
    
    /// <summary>
    /// Reject the onboarding case
    /// </summary>
    public void Reject(string rejectedBy, string reason)
    {
        if (Status == OnboardingStatus.Approved)
            throw new InvalidOperationException("Cannot reject an approved case");
        
        Status = OnboardingStatus.Rejected;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = rejectedBy;
        Metadata["rejection_reason"] = reason;
        
        AddDomainEvent(new OnboardingCaseRejectedEvent(
            Id,
            CaseNumber,
            PartnerId,
            reason,
            DateTime.UtcNow
        ));
    }
    
    /// <summary>
    /// Request additional information
    /// </summary>
    public void RequestAdditionalInfo(string requestedBy, string message)
    {
        if (Status == OnboardingStatus.Approved || Status == OnboardingStatus.Rejected)
            throw new InvalidOperationException($"Cannot request info for case in status {Status}");
        
        Status = OnboardingStatus.AdditionalInfoRequired;
        UpdatedAt = DateTime.UtcNow;
        UpdatedBy = requestedBy;
        
        AddDomainEvent(new AdditionalInfoRequestedEvent(
            Id,
            CaseNumber,
            message,
            DateTime.UtcNow
        ));
    }
    
    public void ClearDomainEvents() => _domainEvents.Clear();
    
    private void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    
    private static string GenerateCaseNumber()
    {
        // Format: OBC-YYYYMMDD-XXXXX
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Random.Shared.Next(10000, 99999);
        return $"OBC-{datePart}-{randomPart}";
    }
}

/// <summary>
/// Onboarding type enum
/// </summary>
public enum OnboardingType
{
    Individual = 1,
    Business = 2
}

/// <summary>
/// Onboarding status enum
/// </summary>
public enum OnboardingStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    AdditionalInfoRequired = 4,
    Approved = 5,
    Rejected = 6
}

/// <summary>
/// Document request tracking
/// </summary>
public class DocumentRequest
{
    public Guid Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
}

/// <summary>
/// Checklist item tracking
/// </summary>
public class ChecklistItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
}

