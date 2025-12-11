using OnboardingApi.Domain.Projections;
using OnboardingApi.Domain.Projections.ReadModels;

namespace OnboardingApi.Application.Projections.Interfaces;

public interface IProjectionRepository
{
    Task<PagedResult<OnboardingCaseProjection>> GetOnboardingCasesAsync(
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
        CancellationToken cancellationToken = default);

    Task<OnboardingCaseProjection?> GetOnboardingCaseAsync(string caseId, CancellationToken cancellationToken = default);

    Task<DashboardProjection> GetDashboardAsync(string? partnerId = null, CancellationToken cancellationToken = default);

    Task<List<OnboardingCaseProjection>> GetCasesByPartnerAsync(string partnerId, CancellationToken cancellationToken = default);

    Task<List<OnboardingCaseProjection>> GetCasesRequiringAttentionAsync(string? partnerId = null, CancellationToken cancellationToken = default);
}

