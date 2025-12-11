namespace OnboardingApi.Domain.Projections.ReadModels;

/// <summary>
/// Dashboard metrics and KPIs for the React frontend
/// </summary>
public class DashboardProjection
{
    public DateTime GeneratedAt { get; set; }
    public string PartnerId { get; set; } = string.Empty;
    public string? PartnerName { get; set; }
    
    // Case Statistics
    public CaseStatistics Cases { get; set; } = new();
    
    // Performance Metrics
    public PerformanceMetrics Performance { get; set; } = new();
    
    // Risk Metrics
    public RiskMetrics Risk { get; set; } = new();
    
    // Compliance Metrics
    public ComplianceMetrics Compliance { get; set; } = new();
    
    // Recent Activity
    public List<RecentActivity> RecentActivities { get; set; } = new();
    
    // Trends (last 30 days)
    public List<DailyMetric> DailyTrends { get; set; } = new();
}

public class CaseStatistics
{
    public int TotalCases { get; set; }
    public int ActiveCases { get; set; }
    public int CompletedCases { get; set; }
    public int RejectedCases { get; set; }
    public int PendingReviewCases { get; set; }
    public int OverdueCases { get; set; }
    
    // By Type
    public int IndividualCases { get; set; }
    public int CorporateCases { get; set; }
    public int TrustCases { get; set; }
    public int PartnershipCases { get; set; }
    
    // This Month vs Last Month
    public int NewCasesThisMonth { get; set; }
    public int NewCasesLastMonth { get; set; }
    public decimal NewCasesGrowthPercentage { get; set; }
    
    public int CompletedCasesThisMonth { get; set; }
    public int CompletedCasesLastMonth { get; set; }
    public decimal CompletedCasesGrowthPercentage { get; set; }
}

public class PerformanceMetrics
{
    public decimal AverageCompletionTimeHours { get; set; }
    public decimal MedianCompletionTimeHours { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal ApprovalRate { get; set; }
    public decimal RejectionRate { get; set; }
    
    // SLA Metrics
    public decimal SlaComplianceRate { get; set; }
    public int CasesBreachingSla { get; set; }
    public decimal AverageResponseTimeHours { get; set; }
}

public class RiskMetrics
{
    public int HighRiskCases { get; set; }
    public int MediumRiskCases { get; set; }
    public int LowRiskCases { get; set; }
    public decimal AverageRiskScore { get; set; }
    
    // Risk Distribution
    public Dictionary<string, int> RiskFactorDistribution { get; set; } = new();
    
    // Escalations
    public int CasesRequiringManualReview { get; set; }
    public int EscalatedCases { get; set; }
}

public class ComplianceMetrics
{
    public int AmlScreeningsPending { get; set; }
    public int AmlScreeningsCompleted { get; set; }
    public int PepMatches { get; set; }
    public int SanctionsMatches { get; set; }
    public int AdverseMediaMatches { get; set; }
    
    // Document Verification
    public int DocumentsAwaitingVerification { get; set; }
    public int DocumentsVerified { get; set; }
    public int DocumentsRejected { get; set; }
    public decimal DocumentVerificationRate { get; set; }
    
    // Audit Trail
    public int AuditEventsToday { get; set; }
    public int CriticalAuditEvents { get; set; }
}

public class RecentActivity
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CaseId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Severity { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class DailyMetric
{
    public DateTime Date { get; set; }
    public int NewCases { get; set; }
    public int CompletedCases { get; set; }
    public int RejectedCases { get; set; }
    public decimal AverageRiskScore { get; set; }
    public decimal CompletionRate { get; set; }
    public int HighRiskCases { get; set; }
}

