using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetWizardConfigurationByEntityTypeQuery(Guid EntityTypeId) : IRequest<WizardConfiguration?>;

