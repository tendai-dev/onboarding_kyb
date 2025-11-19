using EntityConfigurationService.Application.Interfaces;
using MediatR;

namespace EntityConfigurationService.Application.Queries;

public class GetWizardConfigurationByIdQueryHandler : IRequestHandler<GetWizardConfigurationByIdQuery, Domain.Aggregates.WizardConfiguration?>
{
    private readonly IWizardConfigurationRepository _repository;

    public GetWizardConfigurationByIdQueryHandler(IWizardConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Domain.Aggregates.WizardConfiguration?> Handle(GetWizardConfigurationByIdQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetByIdAsync(request.Id, cancellationToken);
    }
}

