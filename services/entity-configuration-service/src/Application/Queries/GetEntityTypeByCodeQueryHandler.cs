using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetEntityTypeByCodeQueryHandler : IRequestHandler<GetEntityTypeByCodeQuery, EntityType?>
{
    private readonly IEntityTypeRepository _repository;

    public GetEntityTypeByCodeQueryHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<EntityType?> Handle(GetEntityTypeByCodeQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetByCodeAsync(request.Code, cancellationToken);
    }
}

