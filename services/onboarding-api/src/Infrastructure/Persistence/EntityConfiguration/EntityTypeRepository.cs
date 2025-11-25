using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class EntityTypeRepository : IEntityTypeRepository
{
    private readonly EntityConfigurationDbContext _context;
    private readonly ILogger<EntityTypeRepository> _logger;

    public EntityTypeRepository(EntityConfigurationDbContext context, ILogger<EntityTypeRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<EntityType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // For OwnsMany relationships, Include should work, but let's try both approaches
        var entityType = await _context.EntityTypes
            .Include(e => e.Requirements)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        
        if (entityType != null)
        {
            // Also explicitly load to ensure they're loaded
            try
            {
                await _context.Entry(entityType)
                    .Collection(e => e.Requirements)
                    .LoadAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[EntityTypeRepository] Failed to explicitly load requirements collection");
            }
            
            var requirementsCount = entityType.Requirements?.Count ?? 0;
            _logger.LogInformation("[EntityTypeRepository] Loaded EntityType {Code} with {Count} requirements", 
                entityType.Code, requirementsCount);
            
            if (requirementsCount > 0)
            {
                var requirementIds = entityType.Requirements.Select(r => r.RequirementId).ToList();
                _logger.LogInformation("[EntityTypeRepository] Requirement IDs: {Ids}", 
                    string.Join(", ", requirementIds));
            }
            else
            {
                _logger.LogWarning("[EntityTypeRepository] EntityType {Code} has NO requirements loaded!", entityType.Code);
            }
        }
        
        return entityType;
    }

    public async Task<EntityType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.EntityTypes
            .Include(e => e.Requirements)
            .FirstOrDefaultAsync(e => e.Code == code, cancellationToken);
    }

    public async Task<List<EntityType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.EntityTypes.AsQueryable();
        
        if (!includeInactive)
            query = query.Where(e => e.IsActive);

        return await query
            .OrderBy(e => e.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<EntityType>> GetAllWithRequirementsAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.EntityTypes
            .Include(e => e.Requirements)
            .AsQueryable();
        
        if (!includeInactive)
            query = query.Where(e => e.IsActive);

        return await query
            .OrderBy(e => e.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        await _context.EntityTypes.AddAsync(entityType, cancellationToken);
    }

    public async Task UpdateAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        _context.EntityTypes.Update(entityType);
    }

    public async Task DeleteAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        _context.EntityTypes.Remove(entityType);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entityType = await GetByIdAsync(id, cancellationToken);
        if (entityType != null)
        {
            await DeleteAsync(entityType, cancellationToken);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

