using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class WizardConfigurationRepository : IWizardConfigurationRepository
{
    private readonly EntityConfigurationDbContext _context;
    private readonly ILogger<WizardConfigurationRepository> _logger;

    public WizardConfigurationRepository(EntityConfigurationDbContext context, ILogger<WizardConfigurationRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WizardConfiguration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var wizardConfig = await _context.WizardConfigurations
            .Include(w => w.Steps)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        
        if (wizardConfig != null)
        {
            // Explicitly load the owned collection
            await _context.Entry(wizardConfig)
                .Collection(w => w.Steps)
                .LoadAsync(cancellationToken);
        }
        
        return wizardConfig;
    }

    public async Task<WizardConfiguration?> GetByEntityTypeIdAsync(Guid entityTypeId, CancellationToken cancellationToken = default)
    {
        var wizardConfig = await _context.WizardConfigurations
            .Include(w => w.Steps)
            .FirstOrDefaultAsync(w => w.EntityTypeId == entityTypeId, cancellationToken);
        
        if (wizardConfig != null)
        {
            // Explicitly load the owned collection
            await _context.Entry(wizardConfig)
                .Collection(w => w.Steps)
                .LoadAsync(cancellationToken);
        }
        
        return wizardConfig;
    }

    public async Task<List<WizardConfiguration>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.WizardConfigurations
            .Include(w => w.Steps)
            .AsQueryable();
        
        if (!includeInactive)
            query = query.Where(w => w.IsActive);
        
        var configs = await query.ToListAsync(cancellationToken);
        
        // Explicitly load steps for each configuration
        foreach (var config in configs)
        {
            await _context.Entry(config)
                .Collection(w => w.Steps)
                .LoadAsync(cancellationToken);
        }
        
        return configs;
    }

    public async Task AddAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        await _context.WizardConfigurations.AddAsync(wizardConfiguration, cancellationToken);
    }

    public async Task UpdateAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        _context.WizardConfigurations.Update(wizardConfiguration);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        _context.WizardConfigurations.Remove(wizardConfiguration);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var wizardConfig = await GetByIdAsync(id, cancellationToken);
        if (wizardConfig != null)
        {
            await DeleteAsync(wizardConfig, cancellationToken);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

