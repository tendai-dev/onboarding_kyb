using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetEntityTypeByIdQueryHandler : IRequestHandler<GetEntityTypeByIdQuery, EntityType?>
{
    private readonly IEntityTypeRepository _repository;

    public GetEntityTypeByIdQueryHandler(IEntityTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<EntityType?> Handle(GetEntityTypeByIdQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetByIdAsync(request.Id, cancellationToken);
    }
}
