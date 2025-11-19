using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetAllWizardConfigurationsQuery(
    bool IncludeInactive = false
) : IRequest<List<WizardConfiguration>>;

