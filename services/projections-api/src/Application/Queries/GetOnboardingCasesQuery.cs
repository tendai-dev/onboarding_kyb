using ProjectionsApi.Domain;
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
