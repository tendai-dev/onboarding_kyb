using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Application.EntityConfiguration.Interfaces;

public interface ICountryConfigurationRepository
{
    Task<CountryProfile?> GetByCountryCodeAsync(string countryCode, CancellationToken cancellationToken = default);
    Task<CountryProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<CountryProfile>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task AddAsync(CountryProfile countryProfile, CancellationToken cancellationToken = default);
    Task UpdateAsync(CountryProfile countryProfile, CancellationToken cancellationToken = default);
    Task DeleteAsync(CountryProfile countryProfile, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

