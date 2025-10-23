using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetAllEntityTypesQueryHandler : IRequestHandler<GetAllEntityTypesQuery, List<EntityType>>
{
    private readonly IEntityTypeRepository _repository;

    public GetAllEntityTypesQueryHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<EntityType>> Handle(GetAllEntityTypesQuery request, CancellationToken cancellationToken)
    {
        if (request.IncludeRequirements)
        {
            return await _repository.GetAllWithRequirementsAsync(request.IncludeInactive, cancellationToken);
        }

        return await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);
    }
}


