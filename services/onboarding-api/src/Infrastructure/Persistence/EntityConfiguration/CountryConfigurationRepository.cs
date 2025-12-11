using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class CountryConfigurationRepository : ICountryConfigurationRepository
{
    private readonly EntityConfigurationDbContext _context;

    public CountryConfigurationRepository(EntityConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<CountryProfile?> GetByCountryCodeAsync(string countryCode, CancellationToken cancellationToken = default)
    {
        return await _context.CountryProfiles
            .Include(cp => cp.EntityTypeOverrides)
            .Include(cp => cp.TerminologyOverrides)
            .Include(cp => cp.FormBundles)
            .Include(cp => cp.FieldVisibilityRules)
            .Include(cp => cp.ComplianceToggles)
            .Include(cp => cp.Tags)
            .FirstOrDefaultAsync(cp => cp.CountryCode == countryCode, cancellationToken);
    }

    public async Task<CountryProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CountryProfiles
            .Include(cp => cp.EntityTypeOverrides)
            .Include(cp => cp.TerminologyOverrides)
            .Include(cp => cp.FormBundles)
            .Include(cp => cp.FieldVisibilityRules)
            .Include(cp => cp.ComplianceToggles)
            .Include(cp => cp.Tags)
            .FirstOrDefaultAsync(cp => cp.Id == id, cancellationToken);
    }

    public async Task<List<CountryProfile>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.CountryProfiles
            .Include(cp => cp.EntityTypeOverrides)
            .Include(cp => cp.TerminologyOverrides)
            .Include(cp => cp.FormBundles)
            .Include(cp => cp.FieldVisibilityRules)
            .Include(cp => cp.ComplianceToggles)
            .Include(cp => cp.Tags)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(cp => cp.IsActive);

        return await query.ToListAsync(cancellationToken);
    }

    public async Task AddAsync(CountryProfile countryProfile, CancellationToken cancellationToken = default)
    {
        await _context.CountryProfiles.AddAsync(countryProfile, cancellationToken);
    }

    public async Task UpdateAsync(CountryProfile countryProfile, CancellationToken cancellationToken = default)
    {
        _context.CountryProfiles.Update(countryProfile);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(CountryProfile countryProfile, CancellationToken cancellationToken = default)
    {
        _context.CountryProfiles.Remove(countryProfile);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

