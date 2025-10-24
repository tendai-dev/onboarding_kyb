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
        return await _context.EntityTypes
            .Include(e => e.Requirements)
                .ThenInclude(r => r.Requirement)
            .FirstOrDefaultAsync(e => e.Code == code, cancellationToken);
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
        _context.EntityTypes.Update(entityType);
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
