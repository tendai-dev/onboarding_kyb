using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using EntityConfigurationService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EntityConfigurationService.Infrastructure.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly EntityConfigurationDbContext _context;

    public RoleRepository(EntityConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<Role?> GetByIdAsync(Guid id, bool includePermissions = false, bool includeUserRoles = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Roles.AsQueryable();
        
        if (includePermissions)
        {
            query = query.Include(r => r.Permissions);
        }
        
        if (includeUserRoles)
        {
            query = query.Include(r => r.UserRoles);
        }

        return await query.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<Role?> GetByNameAsync(string name, bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Roles.AsQueryable();
        
        if (includePermissions)
        {
            query = query.Include(r => r.Permissions);
        }

        return await query.FirstOrDefaultAsync(r => r.Name == name.ToLowerInvariant().Trim(), cancellationToken);
    }

    public async Task<IEnumerable<Role>> GetAllAsync(bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Roles.AsQueryable();
        
        if (includePermissions)
        {
            query = query.Include(r => r.Permissions);
        }

        return await query
            .OrderBy(r => r.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task<Role> CreateAsync(Role role, CancellationToken cancellationToken = default)
    {
        await _context.Roles.AddAsync(role, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return role;
    }

    public async Task UpdateAsync(Role role, CancellationToken cancellationToken = default)
    {
        _context.Roles.Update(role);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await GetByIdAsync(id, cancellationToken: cancellationToken);
        if (role != null)
        {
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

