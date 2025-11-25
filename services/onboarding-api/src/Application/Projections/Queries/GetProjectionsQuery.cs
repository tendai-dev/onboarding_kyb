using MediatR;
using OnboardingApi.Application.Projections.Interfaces;
using OnboardingApi.Domain.Projections;
using OnboardingApi.Domain.Projections.ReadModels;

namespace OnboardingApi.Application.Projections.Queries;

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

public record GetCasesRequiringAttentionQuery(string? PartnerId = null) : IRequest<List<OnboardingCaseProjection>>;

public class GetOnboardingCasesQueryHandler : IRequestHandler<GetOnboardingCasesQuery, PagedResult<OnboardingCaseProjection>>
{
    private readonly IProjectionRepository _repository;

    public GetOnboardingCasesQueryHandler(IProjectionRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<OnboardingCaseProjection>> Handle(GetOnboardingCasesQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetOnboardingCasesAsync(
            request.PartnerId,
            request.Status,
            request.RiskLevel,
            request.AssignedTo,
            request.IsOverdue,
            request.RequiresManualReview,
            request.FromDate,
            request.ToDate,
            request.SearchTerm,
            request.SortBy,
            request.SortDirection,
            request.Skip,
            request.Take,
            cancellationToken);
    }
}

public class GetOnboardingCaseQueryHandler : IRequestHandler<GetOnboardingCaseQuery, OnboardingCaseProjection?>
{
    private readonly IProjectionRepository _repository;

    public GetOnboardingCaseQueryHandler(IProjectionRepository repository)
    {
        _repository = repository;
    }

    public async Task<OnboardingCaseProjection?> Handle(GetOnboardingCaseQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetOnboardingCaseAsync(request.CaseId, cancellationToken);
    }
}

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, DashboardProjection>
{
    private readonly IProjectionRepository _repository;

    public GetDashboardQueryHandler(IProjectionRepository repository)
    {
        _repository = repository;
    }

    public async Task<DashboardProjection> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetDashboardAsync(request.PartnerId, cancellationToken);
    }
}

public class GetCasesRequiringAttentionQueryHandler : IRequestHandler<GetCasesRequiringAttentionQuery, List<OnboardingCaseProjection>>
{
    private readonly IProjectionRepository _repository;

    public GetCasesRequiringAttentionQueryHandler(IProjectionRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<OnboardingCaseProjection>> Handle(GetCasesRequiringAttentionQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetCasesRequiringAttentionAsync(request.PartnerId, cancellationToken);
    }
}

