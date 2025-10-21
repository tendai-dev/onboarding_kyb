using ProjectionsApi.Domain.ReadModels;
using MediatR;

namespace ProjectionsApi.Application.Queries;

public record GetOnboardingCasesQuery(
    string? PartnerId = null,
    string? Status = null,
    string? RiskLevel = null,
    string? AssignedTo = null,
    bool? IsOverdue = null,
    bool? RequiresManualReview = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? SearchTerm = null,
    string? SortBy = null,
    string? SortDirection = null,
    int Skip = 0,
    int Take = 50) : IRequest<PagedResult<OnboardingCaseProjection>>;

public record GetOnboardingCaseQuery(string CaseId) : IRequest<OnboardingCaseProjection?>;

public record GetDashboardQuery(string? PartnerId = null) : IRequest<DashboardProjection>;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
    public bool HasNextPage => Skip + Take < TotalCount;
    public bool HasPreviousPage => Skip > 0;
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Take);
    public int CurrentPage => (Skip / Take) + 1;
}
