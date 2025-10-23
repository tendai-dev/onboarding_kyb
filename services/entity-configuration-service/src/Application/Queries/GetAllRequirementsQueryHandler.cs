using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetAllRequirementsQueryHandler : IRequestHandler<GetAllRequirementsQuery, List<Requirement>>
{
    private readonly IRequirementRepository _repository;

    public GetAllRequirementsQueryHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Requirement>> Handle(GetAllRequirementsQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);
    }
}

