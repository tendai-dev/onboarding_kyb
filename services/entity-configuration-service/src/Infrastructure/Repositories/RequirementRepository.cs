using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using EntityConfigurationService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EntityConfigurationService.Infrastructure.Repositories;

public class RequirementRepository : IRequirementRepository
{
    private readonly EntityConfigurationDbContext _context;

    public RequirementRepository(EntityConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<Requirement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Requirements
            .Include(r => r.Options)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<Requirement?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Requirements
            .Include(r => r.Options)
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);
    }

    public async Task<List<Requirement>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Requirements
            .Include(r => r.Options)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(r => r.IsActive);
        }

        return await query
            .OrderBy(r => r.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Requirement>> GetByTypeAsync(RequirementType type, CancellationToken cancellationToken = default)
    {
        return await _context.Requirements
            .Include(r => r.Options)
            .Where(r => r.Type == type && r.IsActive)
            .OrderBy(r => r.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Requirement requirement, CancellationToken cancellationToken = default)
    {
        await _context.Requirements.AddAsync(requirement, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Requirement requirement, CancellationToken cancellationToken = default)
    {
        _context.Requirements.Update(requirement);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requirement = await _context.Requirements.FindAsync(new object[] { id }, cancellationToken);
        if (requirement != null)
        {
            _context.Requirements.Remove(requirement);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
