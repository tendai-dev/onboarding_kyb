using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetEntityTypeByIdQuery(Guid Id) : IRequest<EntityType?>;


