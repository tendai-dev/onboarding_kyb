using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetEntityTypeByCodeQuery(string Code) : IRequest<EntityType?>;

