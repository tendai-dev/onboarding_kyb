using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using EntityConfigurationService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EntityConfigurationService.Infrastructure.Repositories;

public class EntityTypeRepository : IEntityTypeRepository
{
    private readonly EntityConfigurationDbContext _context;

    public EntityTypeRepository(EntityConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<EntityType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
                    .ThenInclude(req => req.Options)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<EntityType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        // Normalize the input code - trim and handle null
        if (string.IsNullOrWhiteSpace(code))
            return null;
            
        var normalizedCode = code.Trim();
        
        // Fetch all entity types with requirements, then filter in memory
        // This handles cases where the code might be stored with trailing/leading spaces
        // We trim both the database value and the input to handle whitespace issues
        var allEntityTypes = await _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
                    .ThenInclude(req => req.Options)
            .ToListAsync(cancellationToken);
        
        var entityType = allEntityTypes
            .FirstOrDefault(e => e.Code.Trim().Equals(normalizedCode, StringComparison.OrdinalIgnoreCase));
        
        return entityType;
    }

    public async Task<List<EntityType>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.EntityTypes.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(e => e.IsActive);
        }

        return await query
            .OrderBy(e => e.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<EntityType>> GetAllWithRequirementsAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
                    .ThenInclude(req => req.Options)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(e => e.IsActive);
        }

        return await query
            .OrderBy(e => e.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        await _context.EntityTypes.AddAsync(entityType, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        var entry = _context.Entry(entityType);
        
        if (entry.State == EntityState.Detached)
        {
            // Entity not tracked - use Update which will attach it and mark all as modified
            _context.EntityTypes.Update(entityType);
        }
        else
        {
            // Entity is already tracked - EF Core change tracking should detect modifications
            // But we need to explicitly track new EntityTypeRequirements
            // Get the currently tracked requirements
            var trackedRequirementIds = entry
                .Collection(e => e.Requirements)
                .Query()
                .Select(r => r.Id)
                .ToList();
            
            // Find new requirements that aren't tracked yet
            foreach (var requirement in entityType.Requirements)
            {
                if (!trackedRequirementIds.Contains(requirement.Id))
                {
                    var requirementEntry = _context.Entry(requirement);
                    if (requirementEntry.State == EntityState.Detached)
                    {
                        // This is a new requirement - add it explicitly
                        // The SaveChangesAsync override will ensure DateTime values are UTC
                        _context.EntityTypeRequirements.Add(requirement);
                    }
                }
            }
        }
        
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddRequirementAsync(Guid entityTypeId, Guid requirementId, bool isRequired, int displayOrder, CancellationToken cancellationToken = default)
    {
        // Create the EntityTypeRequirement directly
        var entityTypeRequirement = new EntityTypeRequirement(
            entityTypeId,
            requirementId,
            isRequired,
            displayOrder
        );

        // Add it to the context
        _context.EntityTypeRequirements.Add(entityTypeRequirement);
        
        // Update the EntityType's UpdatedAt timestamp using ExecuteUpdateAsync to avoid concurrency issues
        await _context.EntityTypes
            .Where(e => e.Id == entityTypeId)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.UpdatedAt, DateTime.UtcNow), cancellationToken);
        
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(EntityType entityType, CancellationToken cancellationToken = default)
    {
        _context.EntityTypes.Remove(entityType);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entityType = await _context.EntityTypes.FindAsync(new object[] { id }, cancellationToken);
        if (entityType != null)
        {
            _context.EntityTypes.Remove(entityType);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
