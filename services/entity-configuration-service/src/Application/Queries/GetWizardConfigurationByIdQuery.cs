using EntityConfigurationService.Domain.Aggregates;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public record GetWizardConfigurationByIdQuery(Guid Id) : IRequest<WizardConfiguration?>;

