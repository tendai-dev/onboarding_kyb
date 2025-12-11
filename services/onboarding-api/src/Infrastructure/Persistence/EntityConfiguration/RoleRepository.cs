using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class RoleRepository : IRoleRepository
{
    private readonly EntityConfigurationDbContext _context;
    private readonly ILogger<RoleRepository> _logger;

    public RoleRepository(EntityConfigurationDbContext context, ILogger<RoleRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Role?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        
        if (role != null)
        {
            await _context.Entry(role)
                .Collection(r => r.Permissions)
                .LoadAsync(cancellationToken);
        }
        
        return role;
    }

    public async Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Name == name, cancellationToken);
        
        if (role != null)
        {
            await _context.Entry(role)
                .Collection(r => r.Permissions)
                .LoadAsync(cancellationToken);
        }
        
        return role;
    }

    public async Task<List<Role>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Roles
            .Include(r => r.Permissions)
            .AsQueryable();
        
        if (!includeInactive)
        {
            query = query.Where(r => r.IsActive);
        }
        
        var roles = await query.ToListAsync(cancellationToken);
        
        // Explicitly load permissions for all roles
        foreach (var role in roles)
        {
            await _context.Entry(role)
                .Collection(r => r.Permissions)
                .LoadAsync(cancellationToken);
        }
        
        return roles;
    }

    public async Task AddAsync(Role role, CancellationToken cancellationToken = default)
    {
        await _context.Roles.AddAsync(role, cancellationToken);
    }

    public Task UpdateAsync(Role role, CancellationToken cancellationToken = default)
    {
        _context.Roles.Update(role);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Role role, CancellationToken cancellationToken = default)
    {
        _context.Roles.Remove(role);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await GetByIdAsync(id, cancellationToken);
        if (role != null)
        {
            await DeleteAsync(role, cancellationToken);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

