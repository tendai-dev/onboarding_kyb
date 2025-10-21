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

    public static RiskAssessment Create(string caseId, string partnerId)
    {
        var assessment = new RiskAssessment
        {
            Id = RiskAssessmentId.New(),
            CaseId = caseId,
            PartnerId = partnerId,
            OverallRiskLevel = RiskLevel.Unknown,
            RiskScore = 0,
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

        RecalculateRiskScore();

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
        RecalculateRiskScore();

        AddDomainEvent(new RiskFactorUpdatedEvent(
            Id.Value,
            CaseId,
            factor.Id.Value,
            factor.Level.ToString(),
            factor.Score));
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

    private void RecalculateRiskScore()
    {
        if (!_factors.Any())
        {
            RiskScore = 0;
            OverallRiskLevel = RiskLevel.Unknown;
            return;
        }

        // Weighted average calculation
        var totalWeightedScore = _factors.Sum(f => f.Score * GetFactorWeight(f.Type));
        var totalWeight = _factors.Sum(f => GetFactorWeight(f.Type));
        
        RiskScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

        // Determine overall risk level based on score
        OverallRiskLevel = RiskScore switch
        {
            >= 80 => RiskLevel.High,
            >= 60 => RiskLevel.MediumHigh,
            >= 40 => RiskLevel.Medium,
            >= 20 => RiskLevel.MediumLow,
            > 0 => RiskLevel.Low,
            _ => RiskLevel.Unknown
        };
    }

    private static decimal GetFactorWeight(RiskFactorType type)
    {
        return type switch
        {
            RiskFactorType.PEP => 1.5m,
            RiskFactorType.Sanctions => 2.0m,
            RiskFactorType.AdverseMedia => 1.2m,
            RiskFactorType.Geography => 1.0m,
            RiskFactorType.Industry => 0.8m,
            RiskFactorType.TransactionPattern => 1.3m,
            RiskFactorType.CustomerProfile => 0.9m,
            RiskFactorType.DocumentRisk => 1.1m,
            _ => 1.0m
        };
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
