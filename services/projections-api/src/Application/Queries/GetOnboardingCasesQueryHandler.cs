using ProjectionsApi.Application.Interfaces;
using ProjectionsApi.Domain.ReadModels;
using MediatR;

namespace ProjectionsApi.Application.Queries;

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
            partnerId: request.PartnerId,
            status: request.Status,
            riskLevel: request.RiskLevel,
            assignedTo: request.AssignedTo,
            isOverdue: request.IsOverdue,
            requiresManualReview: request.RequiresManualReview,
            fromDate: request.FromDate,
            toDate: request.ToDate,
            searchTerm: request.SearchTerm,
            sortBy: request.SortBy,
            sortDirection: request.SortDirection,
            skip: request.Skip,
            take: request.Take,
            cancellationToken: cancellationToken);
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
