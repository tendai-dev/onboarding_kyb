using ProjectionsApi.Application.Interfaces;
using ProjectionsApi.Domain;
using ProjectionsApi.Domain.ReadModels;
using ProjectionsApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Dapper;
using System.Data;

namespace ProjectionsApi.Infrastructure.Repositories;

public class ProjectionRepository : IProjectionRepository
{
    private readonly ProjectionsDbContext _context;
    private readonly IDbConnection _connection;

    public ProjectionRepository(ProjectionsDbContext context, IDbConnection connection)
    {
        _context = context;
        _connection = connection;
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
        // Use raw SQL for complex dashboard queries for better performance
        var sql = @"
            WITH case_stats AS (
                SELECT 
                    COUNT(*) as total_cases,
                    COUNT(*) FILTER (WHERE status IN ('InProgress', 'PendingReview')) as active_cases,
                    COUNT(*) FILTER (WHERE status = 'Approved') as completed_cases,
                    COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_cases,
                    COUNT(*) FILTER (WHERE status = 'PendingReview') as pending_review_cases,
                    COUNT(*) FILTER (WHERE status = 'InProgress' AND created_at < NOW() - INTERVAL '30 days') as overdue_cases,
                    COUNT(*) FILTER (WHERE type = 'Individual') as individual_cases,
                    COUNT(*) FILTER (WHERE type = 'Corporate') as corporate_cases,
                    COUNT(*) FILTER (WHERE type = 'Trust') as trust_cases,
                    COUNT(*) FILTER (WHERE type = 'Partnership') as partnership_cases,
                    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as new_cases_this_month,
                    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
                                     AND created_at < DATE_TRUNC('month', NOW())) as new_cases_last_month,
                    COUNT(*) FILTER (WHERE status = 'Approved' AND approved_at >= DATE_TRUNC('month', NOW())) as completed_cases_this_month,
                    COUNT(*) FILTER (WHERE status = 'Approved' AND approved_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
                                     AND approved_at < DATE_TRUNC('month', NOW())) as completed_cases_last_month
                FROM onboarding_case_projections
                WHERE (@partnerId IS NULL OR partner_id = @partnerId)
            ),
            risk_stats AS (
                SELECT 
                    COUNT(*) FILTER (WHERE risk_level = 'High') as high_risk_cases,
                    COUNT(*) FILTER (WHERE risk_level IN ('Medium', 'MediumHigh')) as medium_risk_cases,
                    COUNT(*) FILTER (WHERE risk_level IN ('Low', 'MediumLow')) as low_risk_cases,
                    AVG(risk_score) as average_risk_score,
                    COUNT(*) FILTER (WHERE requires_manual_review = true) as cases_requiring_manual_review
                FROM onboarding_case_projections
                WHERE (@partnerId IS NULL OR partner_id = @partnerId)
            ),
            performance_stats AS (
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600) as avg_completion_time_hours,
                    COUNT(*) FILTER (WHERE status = 'Approved') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('Approved', 'Rejected')), 0) as approval_rate
                FROM onboarding_case_projections
                WHERE (@partnerId IS NULL OR partner_id = @partnerId)
                AND status IN ('Approved', 'Rejected')
            )
            SELECT * FROM case_stats, risk_stats, performance_stats";

        var parameters = new { partnerId };
        var result = await _connection.QuerySingleAsync(sql, parameters);

        // Get recent activities (simplified for demo)
        var recentActivities = await GetRecentActivitiesAsync(partnerId, cancellationToken);

        // Get daily trends for the last 30 days
        var dailyTrends = await GetDailyTrendsAsync(partnerId, cancellationToken);

        return new DashboardProjection
        {
            GeneratedAt = DateTime.UtcNow,
            PartnerId = partnerId ?? "ALL",
            Cases = new CaseStatistics
            {
                TotalCases = (int)(result.total_cases ?? 0),
                ActiveCases = (int)(result.active_cases ?? 0),
                CompletedCases = (int)(result.completed_cases ?? 0),
                RejectedCases = (int)(result.rejected_cases ?? 0),
                PendingReviewCases = (int)(result.pending_review_cases ?? 0),
                OverdueCases = (int)(result.overdue_cases ?? 0),
                IndividualCases = (int)(result.individual_cases ?? 0),
                CorporateCases = (int)(result.corporate_cases ?? 0),
                TrustCases = (int)(result.trust_cases ?? 0),
                PartnershipCases = (int)(result.partnership_cases ?? 0),
                NewCasesThisMonth = (int)(result.new_cases_this_month ?? 0),
                NewCasesLastMonth = (int)(result.new_cases_last_month ?? 0),
                CompletedCasesThisMonth = (int)(result.completed_cases_this_month ?? 0),
                CompletedCasesLastMonth = (int)(result.completed_cases_last_month ?? 0),
                NewCasesGrowthPercentage = CalculateGrowthPercentage((int)(result.new_cases_this_month ?? 0), (int)(result.new_cases_last_month ?? 0)),
                CompletedCasesGrowthPercentage = CalculateGrowthPercentage((int)(result.completed_cases_this_month ?? 0), (int)(result.completed_cases_last_month ?? 0))
            },
            Performance = new PerformanceMetrics
            {
                AverageCompletionTimeHours = result.avg_completion_time_hours ?? 0,
                ApprovalRate = result.approval_rate ?? 0,
                CompletionRate = (result.total_cases ?? 0) > 0 ? (decimal)(result.completed_cases ?? 0) / (decimal)(result.total_cases ?? 1) * 100 : 0
            },
            Risk = new RiskMetrics
            {
                HighRiskCases = (int)(result.high_risk_cases ?? 0),
                MediumRiskCases = (int)(result.medium_risk_cases ?? 0),
                LowRiskCases = (int)(result.low_risk_cases ?? 0),
                AverageRiskScore = (decimal)(result.average_risk_score ?? 0),
                CasesRequiringManualReview = (int)(result.cases_requiring_manual_review ?? 0)
            },
            Compliance = new ComplianceMetrics
            {
                DocumentsAwaitingVerification = (int)(result.pending_review_cases ?? 0) // Simplified
            },
            RecentActivities = recentActivities,
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

    public async Task RefreshProjectionsAsync(CancellationToken cancellationToken = default)
    {
        // This would typically be implemented as a background service
        // that rebuilds projections from the source data
        // For now, we'll just update the UpdatedAt timestamp
        await _connection.ExecuteAsync(
            "UPDATE onboarding_case_projections SET updated_at = NOW() WHERE updated_at < NOW() - INTERVAL '1 hour'");
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

    private async Task<List<RecentActivity>> GetRecentActivitiesAsync(string? partnerId, CancellationToken cancellationToken)
    {
        // Simplified implementation - in real scenario, this would query audit logs
        var sql = @"
            SELECT 
                id,
                'CaseUpdate' as type,
                'Case ' || case_id || ' status changed to ' || status as description,
                case_id,
                'system' as user_id,
                'System' as user_name,
                updated_at as timestamp,
                'Medium' as severity,
                'case' as icon,
                'blue' as color
            FROM onboarding_case_projections
            WHERE (@partnerId IS NULL OR partner_id = @partnerId)
            AND updated_at >= NOW() - INTERVAL '7 days'
            ORDER BY updated_at DESC
            LIMIT 10";

        var activities = await _connection.QueryAsync<RecentActivity>(sql, new { partnerId });
        return activities.ToList();
    }

    private async Task<List<DailyMetric>> GetDailyTrendsAsync(string? partnerId, CancellationToken cancellationToken)
    {
        var sql = @"
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_cases,
                COUNT(*) FILTER (WHERE status = 'Approved') as completed_cases,
                COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_cases,
                AVG(risk_score) as average_risk_score,
                COUNT(*) FILTER (WHERE status = 'Approved') * 100.0 / NULLIF(COUNT(*), 0) as completion_rate,
                COUNT(*) FILTER (WHERE risk_level = 'High') as high_risk_cases
            FROM onboarding_case_projections
            WHERE (@partnerId IS NULL OR partner_id = @partnerId)
            AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)";

        var trends = await _connection.QueryAsync<DailyMetric>(sql, new { partnerId });
        return trends.ToList();
    }

    private static decimal CalculateGrowthPercentage(int current, int previous)
    {
        if (previous == 0) return current > 0 ? 100 : 0;
        return ((decimal)(current - previous) / previous) * 100;
    }
}
