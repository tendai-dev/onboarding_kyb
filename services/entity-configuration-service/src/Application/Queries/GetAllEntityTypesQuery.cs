using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetAllEntityTypesQuery(
    bool IncludeInactive = false,
    bool IncludeRequirements = false
) : IRequest<List<EntityType>>;


