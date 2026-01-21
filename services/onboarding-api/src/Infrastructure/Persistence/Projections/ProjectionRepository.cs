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
        {
            // Normalize PartnerId for comparison (case-insensitive, trim whitespace)
            // PartnerId is stored as string in projections, so we compare as strings
            var normalizedPartnerId = partnerId.Trim();
            query = query.Where(c => c.PartnerId.ToLower() == normalizedPartnerId.ToLower());
        }

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
            // SECURITY FIX: Validate and sanitize search term to prevent injection
            if (searchTerm.Length > 100)
            {
                searchTerm = searchTerm.Substring(0, 100);
            }
            // Remove potentially dangerous characters
            searchTerm = System.Text.RegularExpressions.Regex.Replace(searchTerm, @"[^\w\s@.-]", "");
            
            query = query.Where(c => 
                c.Id.ToString().Contains(searchTerm) ||
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
        // Support lookup by both GUID (Id field) and case_number (CaseId field)
        // Try GUID first (if it looks like a GUID), then fall back to case_number
        if (Guid.TryParse(caseId, out var guid))
        {
            // Lookup by GUID (Id field)
            var byGuid = await _context.OnboardingCases
                .FirstOrDefaultAsync(c => c.Id == guid, cancellationToken);
            if (byGuid != null)
                return byGuid;
        }
        
        // Fall back to case_number lookup (CaseId field)
        return await _context.OnboardingCases
            .FirstOrDefaultAsync(c => c.CaseId == caseId, cancellationToken);
    }

    public async Task<DashboardProjection> GetDashboardAsync(string? partnerId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases.AsQueryable();
        
        if (!string.IsNullOrEmpty(partnerId))
        {
            // Normalize PartnerId for comparison (case-insensitive, trim whitespace)
            var normalizedPartnerId = partnerId.Trim();
            query = query.Where(c => c.PartnerId.ToLower() == normalizedPartnerId.ToLower());
        }

        // EF Core DbContext doesn't support concurrent operations, so execute queries sequentially
        // Use DateTime.SpecifyKind to ensure UTC kind for PostgreSQL timestamp with time zone compatibility
        var now = DateTime.UtcNow;
        var firstOfThisMonth = DateTime.SpecifyKind(new DateTime(now.Year, now.Month, 1), DateTimeKind.Utc);
        var firstOfLastMonth = DateTime.SpecifyKind(firstOfThisMonth.AddMonths(-1), DateTimeKind.Utc);
        var thirtyDaysAgo = DateTime.SpecifyKind(now.AddDays(-30), DateTimeKind.Utc);

        // Case statistics - execute sequentially
        var totalCases = await query.CountAsync(cancellationToken);
        var activeCases = await query.CountAsync(c => c.Status == "InProgress" || c.Status == "PendingReview", cancellationToken);
        var completedCases = await query.CountAsync(c => c.Status == "Approved", cancellationToken);
        var rejectedCases = await query.CountAsync(c => c.Status == "Rejected", cancellationToken);
        var pendingReviewCases = await query.CountAsync(c => c.Status == "PendingReview", cancellationToken);
        var overdueCases = await query.CountAsync(c => c.Status == "InProgress" && c.CreatedAt < thirtyDaysAgo, cancellationToken);
        var individualCases = await query.CountAsync(c => c.Type == "Individual", cancellationToken);
        var corporateCases = await query.CountAsync(c => c.Type == "Corporate", cancellationToken);
        var trustCases = await query.CountAsync(c => c.Type == "Trust", cancellationToken);
        var partnershipCases = await query.CountAsync(c => c.Type == "Partnership", cancellationToken);
        var newCasesThisMonth = await query.CountAsync(c => c.CreatedAt >= firstOfThisMonth, cancellationToken);
        var newCasesLastMonth = await query.CountAsync(c => 
            c.CreatedAt >= firstOfLastMonth && c.CreatedAt < firstOfThisMonth, cancellationToken);
        var completedCasesThisMonth = await query.CountAsync(c => 
            c.Status == "Approved" && c.ApprovedAt.HasValue && c.ApprovedAt >= firstOfThisMonth, cancellationToken);
        var completedCasesLastMonth = await query.CountAsync(c => 
            c.Status == "Approved" && c.ApprovedAt.HasValue && 
            c.ApprovedAt >= firstOfLastMonth && c.ApprovedAt < firstOfThisMonth, cancellationToken);
        
        // Performance metrics - calculate average completion time client-side
        // EF Core cannot translate TimeSpan.TotalHours to SQL, so we fetch the dates and calculate in memory
        var completedWithDates = await query
            .Where(c => c.Status == "Approved" && c.ApprovedAt.HasValue)
            .Select(c => new { c.CreatedAt, ApprovedAt = c.ApprovedAt!.Value })
            .ToListAsync(cancellationToken);
        var approvedOrRejectedCount = await query.CountAsync(c => c.Status == "Approved" || c.Status == "Rejected", cancellationToken);
        var approvedCount = await query.CountAsync(c => c.Status == "Approved", cancellationToken);
        
        // Risk metrics
        var highRiskCases = await query.CountAsync(c => c.RiskLevel == "High", cancellationToken);
        var mediumRiskCases = await query.CountAsync(c => c.RiskLevel == "Medium" || c.RiskLevel == "MediumHigh", cancellationToken);
        var lowRiskCases = await query.CountAsync(c => c.RiskLevel == "Low" || c.RiskLevel == "MediumLow", cancellationToken);
        // EF Core cannot translate DefaultIfEmpty with AverageAsync, so we use Sum/Count
        var riskScoreSum = await query.SumAsync(c => c.RiskScore, cancellationToken);
        var riskScoreCount = await query.CountAsync(cancellationToken);
        var casesRequiringManualReview = await query.CountAsync(c => c.RequiresManualReview, cancellationToken);
        
        // Compliance metrics
        var documentsAwaitingVerification = await query.SumAsync(c => c.PendingDocumentCount, cancellationToken);
        var documentsVerified = await query.SumAsync(c => c.VerifiedDocumentCount, cancellationToken);
        var documentsRejected = await query.SumAsync(c => c.RejectedDocumentCount, cancellationToken);

        // Build case statistics
        var cases = new CaseStatistics
        {
            TotalCases = totalCases,
            ActiveCases = activeCases,
            CompletedCases = completedCases,
            RejectedCases = rejectedCases,
            PendingReviewCases = pendingReviewCases,
            OverdueCases = overdueCases,
            IndividualCases = individualCases,
            CorporateCases = corporateCases,
            TrustCases = trustCases,
            PartnershipCases = partnershipCases,
            NewCasesThisMonth = newCasesThisMonth,
            NewCasesLastMonth = newCasesLastMonth,
            CompletedCasesThisMonth = completedCasesThisMonth,
            CompletedCasesLastMonth = completedCasesLastMonth
        };

        cases.NewCasesGrowthPercentage = CalculateGrowthPercentage(cases.NewCasesThisMonth, cases.NewCasesLastMonth);
        cases.CompletedCasesGrowthPercentage = CalculateGrowthPercentage(cases.CompletedCasesThisMonth, cases.CompletedCasesLastMonth);

        // Build performance metrics
        // Calculate average completion time from fetched data (client-side calculation)
        var averageCompletionTime = completedWithDates.Count > 0
            ? (decimal)completedWithDates.Average(c => (c.ApprovedAt - c.CreatedAt).TotalHours)
            : 0m;
        var performance = new PerformanceMetrics
        {
            AverageCompletionTimeHours = averageCompletionTime,
            ApprovalRate = approvedOrRejectedCount > 0 
                ? (decimal)approvedCount / approvedOrRejectedCount * 100 
                : 0,
            CompletionRate = cases.TotalCases > 0
                ? (decimal)cases.CompletedCases / cases.TotalCases * 100
                : 0
        };

        // Build risk metrics
        var risk = new RiskMetrics
        {
            HighRiskCases = highRiskCases,
            MediumRiskCases = mediumRiskCases,
            LowRiskCases = lowRiskCases,
            AverageRiskScore = riskScoreCount > 0 ? (decimal)riskScoreSum / riskScoreCount : 0,
            CasesRequiringManualReview = casesRequiringManualReview
        };

        // Build compliance metrics
        var compliance = new ComplianceMetrics
        {
            DocumentsAwaitingVerification = documentsAwaitingVerification,
            DocumentsVerified = documentsVerified,
            DocumentsRejected = documentsRejected
        };

        if (documentsAwaitingVerification + documentsVerified > 0)
        {
            compliance.DocumentVerificationRate = (decimal)documentsVerified / 
                (documentsAwaitingVerification + documentsVerified) * 100;
        }

        // Get daily trends - optimized to only query last 30 days
        var dailyTrends = await GetDailyTrendsOptimized(query, cancellationToken);

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
        // Normalize PartnerId for comparison (case-insensitive, trim whitespace)
        var normalizedPartnerId = partnerId?.Trim() ?? string.Empty;
        return await _context.OnboardingCases
            .Where(c => c.PartnerId.ToLower() == normalizedPartnerId.ToLower())
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<OnboardingCaseProjection>> GetCasesRequiringAttentionAsync(string? partnerId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases.AsQueryable();

        if (!string.IsNullOrEmpty(partnerId))
        {
            // Normalize PartnerId for comparison (case-insensitive, trim whitespace)
            var normalizedPartnerId = partnerId.Trim();
            query = query.Where(c => c.PartnerId.ToLower() == normalizedPartnerId.ToLower());
        }

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

    private async Task<List<DailyMetric>> GetDailyTrendsOptimized(
        IQueryable<OnboardingCaseProjection> query, 
        CancellationToken cancellationToken)
    {
        // Use DateTime.SpecifyKind to ensure UTC kind for PostgreSQL timestamp with time zone compatibility
        var last30Days = Enumerable.Range(0, 30)
            .Select(i => DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(-i), DateTimeKind.Utc))
            .Reverse()
            .ToList();

        var trends = new List<DailyMetric>();
        
        // Query each day's data sequentially (EF Core DbContext doesn't support concurrent operations)
        foreach (var date in last30Days)
        {
            var nextDate = DateTime.SpecifyKind(date.AddDays(1), DateTimeKind.Utc);
            var dayQuery = query.Where(c => c.CreatedAt >= date && c.CreatedAt < nextDate);
            
            var newCases = await dayQuery.CountAsync(cancellationToken);
            var completedCases = await dayQuery.CountAsync(c => c.Status == "Approved", cancellationToken);
            var rejectedCases = await dayQuery.CountAsync(c => c.Status == "Rejected", cancellationToken);
            // EF Core cannot translate DefaultIfEmpty with AverageAsync, so we use Sum/Count
            var riskScoreSum = await dayQuery.SumAsync(c => c.RiskScore, cancellationToken);
            var riskScoreCount = await dayQuery.CountAsync(cancellationToken);
            var highRiskCases = await dayQuery.CountAsync(c => c.RiskLevel == "High", cancellationToken);
            
            var averageRiskScore = riskScoreCount > 0 ? (decimal)riskScoreSum / riskScoreCount : 0;
            
            trends.Add(new DailyMetric
            {
                Date = date,
                NewCases = newCases,
                CompletedCases = completedCases,
                RejectedCases = rejectedCases,
                AverageRiskScore = averageRiskScore,
                CompletionRate = newCases > 0 ? (decimal)completedCases / newCases * 100 : 0,
                HighRiskCases = highRiskCases
            });
        }
        
        return trends;
    }

    private static decimal CalculateGrowthPercentage(int current, int previous)
    {
        if (previous == 0) return current > 0 ? 100 : 0;
        return ((decimal)(current - previous) / previous) * 100;
    }

    /// <summary>
    /// Update the assignee for a case projection (syncs with work item assignment)
    /// </summary>
    public async Task<int> UpdateCaseAssigneeAsync(
        Guid caseId, 
        string? assignedToUserId, 
        string? assignedToUserName, 
        CancellationToken cancellationToken = default)
    {
        var rowsAffected = await _context.OnboardingCases
            .Where(c => c.Id == caseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(c => c.AssignedTo, assignedToUserId)
                .SetProperty(c => c.AssignedToName, assignedToUserName)
                .SetProperty(c => c.AssignedAt, assignedToUserId != null ? DateTime.UtcNow : (DateTime?)null)
                .SetProperty(c => c.UpdatedAt, DateTime.UtcNow),
            cancellationToken);

        if (rowsAffected > 0)
        {
            _logger.LogInformation(
                "Updated case projection assignee: CaseId={CaseId}, AssignedTo={AssignedTo}, AssignedToName={AssignedToName}",
                caseId, assignedToUserId, assignedToUserName);
        }

        return rowsAffected;
    }

    /// <summary>
    /// Update the status for a case projection (syncs with work item status changes)
    /// Maps work item statuses to frontend-expected status values:
    /// - IN_PROGRESS (frontend) = work item InProgress/PendingApproval
    /// - COMPLETE (frontend) = work item Completed/Approved  
    /// - DECLINED (frontend) = work item Declined
    /// - RISK_REVIEW (frontend) = work item requiring manual review
    /// </summary>
    public async Task<int> UpdateCaseStatusAsync(
        Guid caseId, 
        string status, 
        CancellationToken cancellationToken = default)
    {
        var rowsAffected = await _context.OnboardingCases
            .Where(c => c.Id == caseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(c => c.Status, status)
                .SetProperty(c => c.UpdatedAt, DateTime.UtcNow),
            cancellationToken);

        if (rowsAffected > 0)
        {
            _logger.LogInformation(
                "Updated case projection status: CaseId={CaseId}, Status={Status}",
                caseId, status);
        }

        return rowsAffected;
    }
}

