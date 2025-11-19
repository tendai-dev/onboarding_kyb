using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetRequirementByIdQuery(Guid Id) : IRequest<Requirement?>;
