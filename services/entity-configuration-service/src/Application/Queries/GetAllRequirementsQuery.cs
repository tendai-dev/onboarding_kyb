using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetAllRequirementsQuery(
    bool IncludeInactive = false
) : IRequest<List<Requirement>>;

