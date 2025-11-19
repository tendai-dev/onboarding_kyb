namespace ProjectionsApi.Domain.ReadModels;

/// <summary>
/// Optimized read model for onboarding cases - denormalized for frontend consumption
/// </summary>
public class OnboardingCaseProjection
{
    public Guid Id { get; set; }
    public string CaseId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PartnerId { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
    public string PartnerReferenceId { get; set; } = string.Empty;
    
    // Applicant Information
    public string ApplicantFirstName { get; set; } = string.Empty;
    public string ApplicantLastName { get; set; } = string.Empty;
    public string ApplicantEmail { get; set; } = string.Empty;
    public string ApplicantPhone { get; set; } = string.Empty;
    public DateTime? ApplicantDateOfBirth { get; set; }
    public string ApplicantNationality { get; set; } = string.Empty;
    
    // Address Information
    public string ApplicantAddress { get; set; } = string.Empty;
    public string ApplicantCity { get; set; } = string.Empty;
    public string ApplicantCountry { get; set; } = string.Empty;
    
    // Progress Information
    public decimal ProgressPercentage { get; set; }
    public int TotalSteps { get; set; }
    public int CompletedSteps { get; set; }
    
    // Checklist Information
    public Guid? ChecklistId { get; set; }
    public string ChecklistStatus { get; set; } = string.Empty;
    public decimal ChecklistCompletionPercentage { get; set; }
    public int ChecklistTotalItems { get; set; }
    public int ChecklistCompletedItems { get; set; }
    public int ChecklistRequiredItems { get; set; }
    public int ChecklistCompletedRequiredItems { get; set; }
    
    // Risk Assessment Information
    public Guid? RiskAssessmentId { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public string RiskStatus { get; set; } = string.Empty;
    public int RiskFactorCount { get; set; }
    
    // Document Information
    public int DocumentCount { get; set; }
    public int VerifiedDocumentCount { get; set; }
    public int PendingDocumentCount { get; set; }
    public int RejectedDocumentCount { get; set; }
    
    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    
    // Assignment Information
    public string? AssignedTo { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime? AssignedAt { get; set; }
    
    // Compliance Information
    public bool RequiresManualReview { get; set; }
    public bool HasComplianceIssues { get; set; }
    public string? ComplianceNotes { get; set; }
    
    // Dynamic Fields - Metadata from Entity Configuration Service (JSON)
    public string MetadataJson { get; set; } = string.Empty;
    
    // Business Information (for KYB cases)
    public string BusinessLegalName { get; set; } = string.Empty;
    public string BusinessRegistrationNumber { get; set; } = string.Empty;
    public string BusinessTaxId { get; set; } = string.Empty;
    public string BusinessCountryOfRegistration { get; set; } = string.Empty;
    public string BusinessAddress { get; set; } = string.Empty;
    public string BusinessCity { get; set; } = string.Empty;
    public string BusinessIndustry { get; set; } = string.Empty;
    public int? BusinessNumberOfEmployees { get; set; }
    public decimal? BusinessAnnualRevenue { get; set; }
    public string BusinessWebsite { get; set; } = string.Empty;
    
    // Calculated Properties for Frontend
    public string StatusBadgeColor => Status switch
    {
        "Draft" => "gray",
        "InProgress" => "blue",
        "PendingReview" => "yellow",
        "Approved" => "green",
        "Rejected" => "red",
        "Cancelled" => "gray",
        _ => "gray"
    };
    
    public string RiskBadgeColor => RiskLevel switch
    {
        "Low" => "green",
        "MediumLow" => "yellow",
        "Medium" => "orange",
        "MediumHigh" => "red",
        "High" => "red",
        _ => "gray"
    };
    
    public bool IsOverdue => Status == "InProgress" && CreatedAt < DateTime.UtcNow.AddDays(-30);
    public bool IsHighPriority => RiskLevel is "High" or "MediumHigh" || RequiresManualReview;
    public int DaysInProgress => (DateTime.UtcNow - CreatedAt).Days;
}
