using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using EntityConfigurationService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace EntityConfigurationService.Infrastructure.Repositories;

public class WizardConfigurationRepository : IWizardConfigurationRepository
{
    private readonly EntityConfigurationDbContext _context;

    public WizardConfigurationRepository(EntityConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<WizardConfiguration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.WizardConfigurations
            .Include(w => w.EntityType)
            .Include(w => w.Steps)
                .ThenInclude(s => s.RequirementTypes)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<WizardConfiguration?> GetByEntityTypeIdAsync(Guid entityTypeId, CancellationToken cancellationToken = default)
    {
        return await _context.WizardConfigurations
            .Include(w => w.EntityType)
            .Include(w => w.Steps)
                .ThenInclude(s => s.RequirementTypes)
            .FirstOrDefaultAsync(w => w.EntityTypeId == entityTypeId, cancellationToken);
    }

    public async Task<List<WizardConfiguration>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.WizardConfigurations
            .Include(w => w.EntityType)
            .Include(w => w.Steps)
                .ThenInclude(s => s.RequirementTypes)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(w => w.IsActive);
        }

        return await query
            .OrderBy(w => w.EntityType != null ? w.EntityType.DisplayName : "")
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        await _context.WizardConfigurations.AddAsync(wizardConfiguration, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        // Always reload the entity fresh from the database to avoid concurrency issues
        // This ensures we're working with the latest version
        var existing = await _context.WizardConfigurations
            .Include(w => w.Steps)
                .ThenInclude(s => s.RequirementTypes)
            .FirstOrDefaultAsync(w => w.Id == wizardConfiguration.Id, cancellationToken);
        
        if (existing == null)
        {
            throw new InvalidOperationException($"Wizard configuration with ID '{wizardConfiguration.Id}' not found");
        }

        // Update active status using domain methods
        if (wizardConfiguration.IsActive && !existing.IsActive)
        {
            existing.Activate();
        }
        else if (!wizardConfiguration.IsActive && existing.IsActive)
        {
            existing.Deactivate();
        }
        
        // Delete all existing steps (cascade delete will handle requirement types)
        _context.WizardSteps.RemoveRange(existing.Steps);
        
        // Clear the collection to prepare for new steps
        // We need to use reflection to clear the private _steps field since ReplaceSteps uses it
        existing.ReplaceSteps(wizardConfiguration.Steps);
        
        // Mark the entity as modified to ensure EF tracks the changes
        _context.Entry(existing).State = EntityState.Modified;
        
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(WizardConfiguration wizardConfiguration, CancellationToken cancellationToken = default)
    {
        _context.WizardConfigurations.Remove(wizardConfiguration);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var wizardConfiguration = await _context.WizardConfigurations.FindAsync(new object[] { id }, cancellationToken);
        if (wizardConfiguration != null)
        {
            _context.WizardConfigurations.Remove(wizardConfiguration);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

