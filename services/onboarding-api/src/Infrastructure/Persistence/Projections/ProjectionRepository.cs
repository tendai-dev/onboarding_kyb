using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Projections.Interfaces;
using OnboardingApi.Domain.Projections;
using OnboardingApi.Domain.Projections.ReadModels;
using OnboardingApi.Infrastructure.Persistence.Projections;

namespace OnboardingApi.Infrastructure.Persistence.Projections;

public class ProjectionRepository : IProjectionRepository
{
    private readonly ProjectionsDbContext _context;
    private readonly ILogger<ProjectionRepository> _logger;

    public ProjectionRepository(ProjectionsDbContext context, ILogger<ProjectionRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<OnboardingCaseProjection>> GetOnboardingCasesAsync(
        string? partnerId = null,
        string? status = null,
        string? riskLevel = null,
        string? assignedTo = null,
        bool? isOverdue = null,
        bool? requiresManualReview = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? searchTerm = null,
        string? sortBy = null,
        string? sortDirection = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(partnerId))
            query = query.Where(c => c.PartnerId == partnerId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrEmpty(riskLevel))
            query = query.Where(c => c.RiskLevel == riskLevel);

        if (!string.IsNullOrEmpty(assignedTo))
            query = query.Where(c => c.AssignedTo == assignedTo);

        if (requiresManualReview.HasValue)
            query = query.Where(c => c.RequiresManualReview == requiresManualReview.Value);

        if (fromDate.HasValue)
            query = query.Where(c => c.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(c => c.CreatedAt <= toDate.Value);

        if (isOverdue.HasValue && isOverdue.Value)
            query = query.Where(c => c.Status == "InProgress" && c.CreatedAt < DateTime.UtcNow.AddDays(-30));

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(c => 
                c.CaseId.Contains(searchTerm) ||
                c.ApplicantFirstName.Contains(searchTerm) ||
                c.ApplicantLastName.Contains(searchTerm) ||
                c.ApplicantEmail.Contains(searchTerm) ||
                c.PartnerReferenceId.Contains(searchTerm));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = ApplySorting(query, sortBy, sortDirection);

        // Apply pagination
        var items = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return new PagedResult<OnboardingCaseProjection>
        {
            Items = items,
            TotalCount = totalCount,
            Skip = skip,
            Take = take
        };
    }

    public async Task<OnboardingCaseProjection?> GetOnboardingCaseAsync(string caseId, CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases
            .FirstOrDefaultAsync(c => c.CaseId == caseId, cancellationToken);
    }

    public async Task<DashboardProjection> GetDashboardAsync(string? partnerId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases.AsQueryable();
        
        if (!string.IsNullOrEmpty(partnerId))
            query = query.Where(c => c.PartnerId == partnerId);

        var allCases = await query.ToListAsync(cancellationToken);

        // Calculate statistics
        var cases = new CaseStatistics
        {
            TotalCases = allCases.Count,
            ActiveCases = allCases.Count(c => c.Status is "InProgress" or "PendingReview"),
            CompletedCases = allCases.Count(c => c.Status == "Approved"),
            RejectedCases = allCases.Count(c => c.Status == "Rejected"),
            PendingReviewCases = allCases.Count(c => c.Status == "PendingReview"),
            OverdueCases = allCases.Count(c => c.Status == "InProgress" && c.CreatedAt < DateTime.UtcNow.AddDays(-30)),
            IndividualCases = allCases.Count(c => c.Type == "Individual"),
            CorporateCases = allCases.Count(c => c.Type == "Corporate"),
            TrustCases = allCases.Count(c => c.Type == "Trust"),
            PartnershipCases = allCases.Count(c => c.Type == "Partnership"),
            NewCasesThisMonth = allCases.Count(c => c.CreatedAt >= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1)),
            NewCasesLastMonth = allCases.Count(c => 
                c.CreatedAt >= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-1) &&
                c.CreatedAt < new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1)),
            CompletedCasesThisMonth = allCases.Count(c => c.Status == "Approved" && c.ApprovedAt >= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1)),
            CompletedCasesLastMonth = allCases.Count(c => 
                c.Status == "Approved" && 
                c.ApprovedAt >= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-1) &&
                c.ApprovedAt < new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1))
        };

        cases.NewCasesGrowthPercentage = CalculateGrowthPercentage(cases.NewCasesThisMonth, cases.NewCasesLastMonth);
        cases.CompletedCasesGrowthPercentage = CalculateGrowthPercentage(cases.CompletedCasesThisMonth, cases.CompletedCasesLastMonth);

        var completedCases = allCases.Where(c => c.Status == "Approved" && c.ApprovedAt.HasValue).ToList();
        var performance = new PerformanceMetrics
        {
            AverageCompletionTimeHours = completedCases.Any() 
                ? (decimal)completedCases.Average(c => (c.ApprovedAt!.Value - c.CreatedAt).TotalHours)
                : 0,
            ApprovalRate = allCases.Count(c => c.Status is "Approved" or "Rejected") > 0
                ? (decimal)allCases.Count(c => c.Status == "Approved") / allCases.Count(c => c.Status is "Approved" or "Rejected") * 100
                : 0,
            CompletionRate = allCases.Count > 0
                ? (decimal)cases.CompletedCases / cases.TotalCases * 100
                : 0
        };

        var risk = new RiskMetrics
        {
            HighRiskCases = allCases.Count(c => c.RiskLevel == "High"),
            MediumRiskCases = allCases.Count(c => c.RiskLevel is "Medium" or "MediumHigh"),
            LowRiskCases = allCases.Count(c => c.RiskLevel is "Low" or "MediumLow"),
            AverageRiskScore = allCases.Any() ? allCases.Average(c => c.RiskScore) : 0,
            CasesRequiringManualReview = allCases.Count(c => c.RequiresManualReview)
        };

        var compliance = new ComplianceMetrics
        {
            DocumentsAwaitingVerification = allCases.Sum(c => c.PendingDocumentCount),
            DocumentsVerified = allCases.Sum(c => c.VerifiedDocumentCount),
            DocumentsRejected = allCases.Sum(c => c.RejectedDocumentCount)
        };

        if (compliance.DocumentsAwaitingVerification + compliance.DocumentsVerified > 0)
        {
            compliance.DocumentVerificationRate = (decimal)compliance.DocumentsVerified / 
                (compliance.DocumentsAwaitingVerification + compliance.DocumentsVerified) * 100;
        }

        // Get daily trends for last 30 days
        var dailyTrends = GetDailyTrends(allCases);

        return new DashboardProjection
        {
            GeneratedAt = DateTime.UtcNow,
            PartnerId = partnerId ?? "ALL",
            Cases = cases,
            Performance = performance,
            Risk = risk,
            Compliance = compliance,
            RecentActivities = new List<RecentActivity>(), // Can be populated from audit logs
            DailyTrends = dailyTrends
        };
    }

    public async Task<List<OnboardingCaseProjection>> GetCasesByPartnerAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases
            .Where(c => c.PartnerId == partnerId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<OnboardingCaseProjection>> GetCasesRequiringAttentionAsync(string? partnerId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases.AsQueryable();

        if (!string.IsNullOrEmpty(partnerId))
            query = query.Where(c => c.PartnerId == partnerId);

        return await query
            .Where(c => 
                c.RequiresManualReview ||
                c.HasComplianceIssues ||
                c.RiskLevel == "High" ||
                (c.Status == "InProgress" && c.CreatedAt < DateTime.UtcNow.AddDays(-30)))
            .OrderByDescending(c => c.UpdatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    private static IQueryable<OnboardingCaseProjection> ApplySorting(
        IQueryable<OnboardingCaseProjection> query, 
        string? sortBy, 
        string? sortDirection)
    {
        var isDescending = sortDirection?.ToLower() == "desc";

        return sortBy?.ToLower() switch
        {
            "caseid" => isDescending ? query.OrderByDescending(c => c.CaseId) : query.OrderBy(c => c.CaseId),
            "status" => isDescending ? query.OrderByDescending(c => c.Status) : query.OrderBy(c => c.Status),
            "risklevel" => isDescending ? query.OrderByDescending(c => c.RiskLevel) : query.OrderBy(c => c.RiskLevel),
            "riskscore" => isDescending ? query.OrderByDescending(c => c.RiskScore) : query.OrderBy(c => c.RiskScore),
            "createdat" => isDescending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            "updatedat" => isDescending ? query.OrderByDescending(c => c.UpdatedAt) : query.OrderBy(c => c.UpdatedAt),
            "progress" => isDescending ? query.OrderByDescending(c => c.ProgressPercentage) : query.OrderBy(c => c.ProgressPercentage),
            "applicantname" => isDescending ? query.OrderByDescending(c => c.ApplicantLastName).ThenByDescending(c => c.ApplicantFirstName) : query.OrderBy(c => c.ApplicantLastName).ThenBy(c => c.ApplicantFirstName),
            _ => query.OrderByDescending(c => c.UpdatedAt)
        };
    }

    private static List<DailyMetric> GetDailyTrends(List<OnboardingCaseProjection> allCases)
    {
        var last30Days = Enumerable.Range(0, 30)
            .Select(i => DateTime.UtcNow.Date.AddDays(-i))
            .Reverse()
            .ToList();

        return last30Days.Select(date =>
        {
            var dayCases = allCases.Where(c => c.CreatedAt.Date == date).ToList();
            return new DailyMetric
            {
                Date = date,
                NewCases = dayCases.Count,
                CompletedCases = dayCases.Count(c => c.Status == "Approved"),
                RejectedCases = dayCases.Count(c => c.Status == "Rejected"),
                AverageRiskScore = dayCases.Any() ? dayCases.Average(c => c.RiskScore) : 0,
                CompletionRate = dayCases.Any() 
                    ? (decimal)dayCases.Count(c => c.Status == "Approved") / dayCases.Count * 100 
                    : 0,
                HighRiskCases = dayCases.Count(c => c.RiskLevel == "High")
            };
        }).ToList();
    }

    private static decimal CalculateGrowthPercentage(int current, int previous)
    {
        if (previous == 0) return current > 0 ? 100 : 0;
        return ((decimal)(current - previous) / previous) * 100;
    }
}

