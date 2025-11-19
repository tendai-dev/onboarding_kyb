using ChecklistService.Domain.Events;
using ChecklistService.Domain.ValueObjects;

namespace ChecklistService.Domain.Aggregates;

/// <summary>
/// KYB Checklist Aggregate Root
/// Manages compliance checks for onboarding cases
/// </summary>
public class KybChecklist
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
    public int CompletedItems => _items.Count(i => i.Status == ChecklistItemStatus.Completed);
    public int FailedItems => _items.Count(i => i.Status == ChecklistItemStatus.Skipped);
    public decimal CompletionPercentage => TotalItems > 0 ? (decimal)CompletedItems / TotalItems * 100 : 0;
    
    public bool RequiresEDD { get; private set; }  // Enhanced Due Diligence
    public string? EddReason { get; private set; }
    
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    private KybChecklist() { }
    
    /// <summary>
    /// Create checklist based on entity type and risk tier
    /// </summary>
    public static KybChecklist Create(
        Guid caseId,
        EntityType entityType,
        RiskTier riskTier,
        string createdBy)
    {
        var checklist = new KybChecklist
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
            (ValueObjects.EntityType)checklist.EntityType,
            (ValueObjects.RiskTier)checklist.RiskTier,
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
        
        if (item.Status == ChecklistItemStatus.Completed)
            throw new InvalidOperationException($"Check item {checkCode} already completed");
        
        item.Complete(completedBy, result.Message);
        
        AddDomainEvent(new ChecklistItemCompletedEvent(
            Id,
            CaseId,
            checkCode,
            result.IsValid,
            result.Score,
            DateTime.UtcNow
        ));
        
        // Check if EDD required based on check results
        if (!result.IsValid && IsHighRiskCheck(checkCode))
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
            DateTime.UtcNow
        ));
    }
    
    private void GenerateChecklistItems()
    {
        var order = 1;
        
        if (EntityType == EntityType.Individual)
        {
            // KYB checks for individuals
            _items.Add(ChecklistItem.Create("IDENTITY_VERIFICATION", "Identity Document Verification", "Verify government-issued ID documents", ChecklistItemCategory.Identity, true, order++));
            _items.Add(ChecklistItem.Create("ADDRESS_VERIFICATION", "Address Verification", "Verify residential address", ChecklistItemCategory.Address, true, order++));
            _items.Add(ChecklistItem.Create("SANCTIONS_SCREENING", "Sanctions & PEP Screening", "Screen against sanctions and PEP lists", ChecklistItemCategory.Compliance, true, order++));
            _items.Add(ChecklistItem.Create("ADVERSE_MEDIA", "Adverse Media Check", "Check for negative media coverage", ChecklistItemCategory.Risk, false, order++));
            _items.Add(ChecklistItem.Create("SOURCE_OF_FUNDS", "Source of Funds Declaration", "Verify source of funds", ChecklistItemCategory.Financial, RiskTier != RiskTier.Low, order++));
            
            if (RiskTier == RiskTier.High)
            {
                _items.Add(ChecklistItem.Create("ENHANCED_SCREENING", "Enhanced Background Screening", "Conduct enhanced due diligence", ChecklistItemCategory.Verification, true, order++));
                _items.Add(ChecklistItem.Create("SOURCE_OF_WEALTH", "Source of Wealth Verification", "Verify source of wealth", ChecklistItemCategory.Financial, true, order++));
            }
        }
        else // Business
        {
            // KYB checks for businesses
            _items.Add(ChecklistItem.Create("BUSINESS_REGISTRATION", "Business Registration Verification", "Verify business registration documents", ChecklistItemCategory.Documentation, true, order++));
            _items.Add(ChecklistItem.Create("UBO_IDENTIFICATION", "Ultimate Beneficial Owner Identification", "Identify and verify UBOs", ChecklistItemCategory.Identity, true, order++));
            _items.Add(ChecklistItem.Create("BUSINESS_ADDRESS", "Business Address Verification", "Verify business address", ChecklistItemCategory.Address, true, order++));
            _items.Add(ChecklistItem.Create("SANCTIONS_SCREENING", "Entity Sanctions Screening", "Screen entity against sanctions lists", ChecklistItemCategory.Compliance, true, order++));
            _items.Add(ChecklistItem.Create("ADVERSE_MEDIA", "Corporate Adverse Media Check", "Check for negative corporate media", ChecklistItemCategory.Risk, false, order++));
            _items.Add(ChecklistItem.Create("FINANCIAL_STANDING", "Financial Standing Assessment", "Assess financial standing", ChecklistItemCategory.Financial, true, order++));
            _items.Add(ChecklistItem.Create("INDUSTRY_RISK", "Industry Risk Assessment", "Assess industry-specific risks", ChecklistItemCategory.Risk, true, order++));
            
            if (RiskTier == RiskTier.High)
            {
                _items.Add(ChecklistItem.Create("ENHANCED_UBO_SCREENING", "Enhanced UBO Screening", "Enhanced UBO due diligence", ChecklistItemCategory.Verification, true, order++));
                _items.Add(ChecklistItem.Create("SOURCE_OF_FUNDS_BUSINESS", "Business Source of Funds", "Verify business funding sources", ChecklistItemCategory.Financial, true, order++));
                _items.Add(ChecklistItem.Create("BENEFICIAL_OWNERSHIP_STRUCTURE", "Ownership Structure Analysis", "Analyze ownership structure", ChecklistItemCategory.Documentation, true, order++));
            }
        }
    }
    
    private void UpdateStatus()
    {
        var mandatoryItems = _items.Where(i => i.IsRequired).ToList();
        var allMandatoryCompleted = mandatoryItems.All(i => i.Status == ChecklistItemStatus.Completed);
        var anyMandatoryFailed = false; // ChecklistItemStatus doesn't have Failed, using Skipped as alternative
        
        if (anyMandatoryFailed)
        {
            Status = ChecklistStatus.Cancelled;
            AddDomainEvent(new ChecklistFailedEvent(Id, CaseId, "Mandatory check failed", DateTime.UtcNow));
        }
        else if (allMandatoryCompleted && _items.All(i => i.Status != ChecklistItemStatus.Pending))
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
    Failed = 3,
    Cancelled = 4
}

public enum RiskTier
{
    Low = 1,
    Medium = 2,
    High = 3
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







