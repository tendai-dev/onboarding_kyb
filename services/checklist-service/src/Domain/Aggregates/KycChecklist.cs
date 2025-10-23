using ChecklistService.Domain.Events;
using ChecklistService.Domain.ValueObjects;

namespace ChecklistService.Domain.Aggregates;

/// <summary>
/// KYC/KYB Checklist Aggregate Root
/// Manages compliance checks for onboarding cases
/// </summary>
public class KycChecklist
{
    private readonly List<IDomainEvent> _domainEvents = new();
    private readonly List<ChecklistItem> _items = new();

    public Guid Id { get; private set; }
    public Guid CaseId { get; private set; }
    public EntityType EntityType { get; private set; }
    public ChecklistStatus Status { get; private set; }
    public RiskTier RiskTier { get; private set; }
    
    public IReadOnlyCollection<ChecklistItem> Items => _items.AsReadOnly();
    
    public int TotalItems => _items.Count;
    public int CompletedItems => _items.Count(i => i.Status == CheckStatus.Completed);
    public int FailedItems => _items.Count(i => i.Status == CheckStatus.Failed);
    public decimal CompletionPercentage => TotalItems > 0 ? (decimal)CompletedItems / TotalItems * 100 : 0;
    
    public bool RequiresEDD { get; private set; }  // Enhanced Due Diligence
    public string? EddReason { get; private set; }
    
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    private KycChecklist() { }
    
    /// <summary>
    /// Create checklist based on entity type and risk tier
    /// </summary>
    public static KycChecklist Create(
        Guid caseId,
        EntityType entityType,
        RiskTier riskTier,
        string createdBy)
    {
        var checklist = new KycChecklist
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            EntityType = entityType,
            RiskTier = riskTier,
            Status = ChecklistStatus.InProgress,
            RequiresEDD = riskTier == RiskTier.High,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
        
        // Generate checklist items based on entity type and risk tier
        checklist.GenerateChecklistItems();
        
        checklist.AddDomainEvent(new ChecklistCreatedEvent(
            checklist.Id,
            checklist.CaseId,
            checklist.EntityType,
            checklist.RiskTier,
            checklist.TotalItems,
            DateTime.UtcNow
        ));
        
        return checklist;
    }
    
    /// <summary>
    /// Complete a checklist item
    /// </summary>
    public void CompleteItem(string checkCode, CheckResult result, string completedBy)
    {
        var item = _items.FirstOrDefault(i => i.Code == checkCode);
        if (item == null)
            throw new InvalidOperationException($"Check item {checkCode} not found");
        
        if (item.Status == CheckStatus.Completed)
            throw new InvalidOperationException($"Check item {checkCode} already completed");
        
        item.Complete(result, completedBy);
        
        AddDomainEvent(new ChecklistItemCompletedEvent(
            Id,
            CaseId,
            checkCode,
            result.Passed,
            result.Score,
            DateTime.UtcNow
        ));
        
        // Check if EDD required based on check results
        if (!result.Passed && IsHighRiskCheck(checkCode))
        {
            RequiresEDD = true;
            EddReason = $"Failed high-risk check: {checkCode}";
        }
        
        // Update overall status
        UpdateStatus();
    }
    
    /// <summary>
    /// Flag for Enhanced Due Diligence
    /// </summary>
    public void FlagForEDD(string reason, string flaggedBy)
    {
        RequiresEDD = true;
        EddReason = reason;
        
        AddDomainEvent(new ChecklistFlaggedForEDDEvent(
            Id,
            CaseId,
            reason,
            flaggedBy,
            DateTime.UtcNow
        ));
    }
    
    private void GenerateChecklistItems()
    {
        if (EntityType == EntityType.Individual)
        {
            // KYC checks for individuals
            _items.Add(new ChecklistItem("IDENTITY_VERIFICATION", "Identity Document Verification", CheckPriority.Critical, true));
            _items.Add(new ChecklistItem("ADDRESS_VERIFICATION", "Address Verification", CheckPriority.High, true));
            _items.Add(new ChecklistItem("SANCTIONS_SCREENING", "Sanctions & PEP Screening", CheckPriority.Critical, true));
            _items.Add(new ChecklistItem("ADVERSE_MEDIA", "Adverse Media Check", CheckPriority.Medium, false));
            _items.Add(new ChecklistItem("SOURCE_OF_FUNDS", "Source of Funds Declaration", CheckPriority.High, RiskTier != RiskTier.Low));
            
            if (RiskTier == RiskTier.High)
            {
                _items.Add(new ChecklistItem("ENHANCED_SCREENING", "Enhanced Background Screening", CheckPriority.Critical, true));
                _items.Add(new ChecklistItem("SOURCE_OF_WEALTH", "Source of Wealth Verification", CheckPriority.Critical, true));
            }
        }
        else // Business
        {
            // KYB checks for businesses
            _items.Add(new ChecklistItem("BUSINESS_REGISTRATION", "Business Registration Verification", CheckPriority.Critical, true));
            _items.Add(new ChecklistItem("UBO_IDENTIFICATION", "Ultimate Beneficial Owner Identification", CheckPriority.Critical, true));
            _items.Add(new ChecklistItem("BUSINESS_ADDRESS", "Business Address Verification", CheckPriority.High, true));
            _items.Add(new ChecklistItem("SANCTIONS_SCREENING", "Entity Sanctions Screening", CheckPriority.Critical, true));
            _items.Add(new ChecklistItem("ADVERSE_MEDIA", "Corporate Adverse Media Check", CheckPriority.Medium, false));
            _items.Add(new ChecklistItem("FINANCIAL_STANDING", "Financial Standing Assessment", CheckPriority.High, true));
            _items.Add(new ChecklistItem("INDUSTRY_RISK", "Industry Risk Assessment", CheckPriority.Medium, true));
            
            if (RiskTier == RiskTier.High)
            {
                _items.Add(new ChecklistItem("ENHANCED_UBO_SCREENING", "Enhanced UBO Screening", CheckPriority.Critical, true));
                _items.Add(new ChecklistItem("SOURCE_OF_FUNDS_BUSINESS", "Business Source of Funds", CheckPriority.Critical, true));
                _items.Add(new ChecklistItem("BENEFICIAL_OWNERSHIP_STRUCTURE", "Ownership Structure Analysis", CheckPriority.Critical, true));
            }
        }
    }
    
    private void UpdateStatus()
    {
        var mandatoryItems = _items.Where(i => i.IsMandatory).ToList();
        var allMandatoryCompleted = mandatoryItems.All(i => i.Status == CheckStatus.Completed);
        var anyMandatoryFailed = mandatoryItems.Any(i => i.Status == CheckStatus.Failed);
        
        if (anyMandatoryFailed)
        {
            Status = ChecklistStatus.Failed;
            AddDomainEvent(new ChecklistFailedEvent(Id, CaseId, "Mandatory check failed", DateTime.UtcNow));
        }
        else if (allMandatoryCompleted && _items.All(i => i.Status != CheckStatus.Pending))
        {
            Status = ChecklistStatus.Completed;
            CompletedAt = DateTime.UtcNow;
            AddDomainEvent(new ChecklistCompletedEvent(Id, CaseId, CompletionPercentage, DateTime.UtcNow));
        }
    }
    
    private static bool IsHighRiskCheck(string checkCode)
    {
        return checkCode is "SANCTIONS_SCREENING" or "IDENTITY_VERIFICATION" 
            or "UBO_IDENTIFICATION" or "ENHANCED_SCREENING";
    }
    
    public void ClearDomainEvents() => _domainEvents.Clear();
    private void AddDomainEvent(IDomainEvent evt) => _domainEvents.Add(evt);
}

public enum EntityType
{
    Individual = 1,
    Business = 2
}

public enum ChecklistStatus
{
    InProgress = 1,
    Completed = 2,
    Failed = 3
}

public enum RiskTier
{
    Low = 1,
    Medium = 2,
    High = 3
}

/// <summary>
/// Individual KYC checklist item
/// </summary>
public class KycChecklistItem
{
    public string Code { get; private set; }
    public string Name { get; private set; }
    public CheckPriority Priority { get; private set; }
    public bool IsMandatory { get; private set; }
    public CheckStatus Status { get; private set; }
    public CheckResult? Result { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? CompletedBy { get; private set; }
    
    public KycChecklistItem(string code, string name, CheckPriority priority, bool isMandatory)
    {
        Code = code;
        Name = name;
        Priority = priority;
        IsMandatory = isMandatory;
        Status = CheckStatus.Pending;
    }
    
    public void Complete(CheckResult result, string completedBy)
    {
        Result = result;
        Status = result.Passed ? CheckStatus.Completed : CheckStatus.Failed;
        CompletedAt = DateTime.UtcNow;
        CompletedBy = completedBy;
    }
}

public enum CheckPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum CheckStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Failed = 4
}





