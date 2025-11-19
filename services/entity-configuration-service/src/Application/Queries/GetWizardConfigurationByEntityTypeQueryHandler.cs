using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetWizardConfigurationByEntityTypeQueryHandler : IRequestHandler<GetWizardConfigurationByEntityTypeQuery, Domain.Aggregates.WizardConfiguration?>
{
    private readonly IWizardConfigurationRepository _repository;

    public GetWizardConfigurationByEntityTypeQueryHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Domain.Aggregates.WizardConfiguration?> Handle(GetWizardConfigurationByEntityTypeQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetByEntityTypeIdAsync(request.EntityTypeId, cancellationToken);
    }
}

