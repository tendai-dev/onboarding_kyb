using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetAllWizardConfigurationsQueryHandler : IRequestHandler<GetAllWizardConfigurationsQuery, List<Domain.Aggregates.WizardConfiguration>>
{
    private readonly IWizardConfigurationRepository _repository;

    public GetAllWizardConfigurationsQueryHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Domain.Aggregates.WizardConfiguration>> Handle(GetAllWizardConfigurationsQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetAllAsync(request.IncludeInactive, cancellationToken);
    }
}

