using RiskService.Domain.Events;
using RiskService.Domain.ValueObjects;
using MediatR;

namespace RiskService.Domain.Aggregates;

public class RiskAssessment
{
    private readonly List<INotification> _domainEvents = new();
    private readonly List<RiskFactor> _factors = new();

    public RiskAssessmentId Id { get; private set; }
    public string CaseId { get; private set; }
    public string PartnerId { get; private set; }
    public RiskLevel OverallRiskLevel { get; private set; }
    public decimal RiskScore { get; private set; }
    public RiskAssessmentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public string? AssessedBy { get; private set; }
    public string? Notes { get; private set; }
    public IReadOnlyList<RiskFactor> Factors => _factors.AsReadOnly();
    public IReadOnlyList<INotification> DomainEvents => _domainEvents.AsReadOnly();

    private RiskAssessment() { } // EF Core

    /// <summary>
    /// Create a new risk assessment
    /// NOTE: Risk assessments are created manually by authorized personnel.
    /// The assessment starts with Unknown risk level until manually classified.
    /// </summary>
    public static RiskAssessment Create(string caseId, string partnerId)
    {
        var assessment = new RiskAssessment
        {
            Id = RiskAssessmentId.New(),
            CaseId = caseId,
            PartnerId = partnerId,
            OverallRiskLevel = RiskLevel.Unknown, // Default to Unknown - must be manually classified
            RiskScore = 0, // No automatic scoring
            Status = RiskAssessmentStatus.InProgress,
            CreatedAt = DateTime.UtcNow
        };

        assessment.AddDomainEvent(new RiskAssessmentCreatedEvent(
            assessment.Id.Value,
            assessment.CaseId,
            assessment.PartnerId));

        return assessment;
    }

    public void AddRiskFactor(RiskFactorType type, RiskLevel level, decimal score, string description, string? source = null)
    {
        var factor = RiskFactor.Create(type, level, score, description, source);
        _factors.Add(factor);

        // NOTE: Risk score is no longer automatically calculated
        // Risk level must be set manually by authorized personnel

        AddDomainEvent(new RiskFactorAddedEvent(
            Id.Value,
            CaseId,
            factor.Id.Value,
            factor.Type.ToString(),
            factor.Level.ToString(),
            factor.Score));
    }

    public void UpdateRiskFactor(RiskFactorId factorId, RiskLevel level, decimal score, string description)
    {
        var factor = _factors.FirstOrDefault(f => f.Id == factorId);
        if (factor == null)
            throw new InvalidOperationException($"Risk factor {factorId} not found");

        factor.Update(level, score, description);
        
        // NOTE: Risk score is no longer automatically calculated
        // Risk level must be set manually by authorized personnel

        AddDomainEvent(new RiskFactorUpdatedEvent(
            Id.Value,
            CaseId,
            factor.Id.Value,
            factor.Level.ToString(),
            factor.Score));
    }

    /// <summary>
    /// Update notes without completing the assessment (for draft saves)
    /// </summary>
    public void UpdateNotes(string? notes = null)
    {
        Notes = notes;
        // Don't change status or completion date - this is just a draft save
    }

    public void CompleteAssessment(string assessedBy, string? notes = null)
    {
        if (Status == RiskAssessmentStatus.Completed)
            return;

        Status = RiskAssessmentStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        AssessedBy = assessedBy;
        Notes = notes;

        AddDomainEvent(new RiskAssessmentCompletedEvent(
            Id.Value,
            CaseId,
            PartnerId,
            OverallRiskLevel.ToString(),
            RiskScore,
            assessedBy));
    }

    public void RejectAssessment(string rejectedBy, string reason)
    {
        Status = RiskAssessmentStatus.Rejected;
        CompletedAt = DateTime.UtcNow;
        AssessedBy = rejectedBy;
        Notes = $"REJECTED: {reason}";

        AddDomainEvent(new RiskAssessmentRejectedEvent(
            Id.Value,
            CaseId,
            PartnerId,
            rejectedBy,
            reason));
    }

    /// <summary>
    /// Set the risk level manually - this is the ONLY way to set risk level.
    /// All risk classifications must be done by authorized personnel through manual review.
    /// </summary>
    public void SetManualRiskLevel(RiskLevel riskLevel, string assessedBy, string justification)
    {
        if (string.IsNullOrWhiteSpace(assessedBy))
            throw new ArgumentException("AssessedBy cannot be empty", nameof(assessedBy));
        
        if (string.IsNullOrWhiteSpace(justification))
            throw new ArgumentException("Justification is required for manual risk determination", nameof(justification));

        var previousLevel = OverallRiskLevel;
        OverallRiskLevel = riskLevel;
        
        // Set score based on manual level for display purposes only
        // This is NOT an automatic calculation - it's just for UI consistency
        RiskScore = riskLevel switch
        {
            RiskLevel.High => 90m,
            RiskLevel.MediumHigh => 70m,
            RiskLevel.Medium => 50m,
            RiskLevel.MediumLow => 30m,
            RiskLevel.Low => 10m,
            _ => 0m
        };

        AssessedBy = assessedBy;
        CompletedAt = DateTime.UtcNow;
        Status = RiskAssessmentStatus.Completed;
        Notes = $"MANUAL CLASSIFICATION: {justification}";

        AddDomainEvent(new RiskLevelManuallySetEvent(
            Id.Value,
            CaseId,
            PartnerId,
            previousLevel.ToString(),
            riskLevel.ToString(),
            assessedBy,
            justification));
    }

    private void AddDomainEvent(INotification domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
