using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Application.EntityConfiguration.Interfaces;

public interface IWizardConfigurationRepository
{
    Task<WizardConfiguration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WizardConfiguration?> GetByEntityTypeIdAsync(Guid entityTypeId, CancellationToken cancellationToken = default);
    Task<List<WizardConfiguration>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task AddAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default);
    Task UpdateAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default);
    Task DeleteAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

