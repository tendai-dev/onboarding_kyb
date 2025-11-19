using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetRequirementByIdQueryHandler : IRequestHandler<GetRequirementByIdQuery, Requirement?>
{
    private readonly IRequirementRepository _repository;

    public GetRequirementByIdQueryHandler(IRequirementRepository repository)
    {
        _repository = repository;
    }

    public async Task<Requirement?> Handle(GetRequirementByIdQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetByIdAsync(request.Id, cancellationToken);
    }
}
