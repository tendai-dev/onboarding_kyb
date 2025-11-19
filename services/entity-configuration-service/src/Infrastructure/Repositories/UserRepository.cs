using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Domain.Aggregates;
using EntityConfigurationService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EntityConfigurationService.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly EntityConfigurationDbContext _context;

    public UserRepository(EntityConfigurationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.Roles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant().Trim(), cancellationToken);
    }

    public async Task<User?> GetByIdAsync(Guid id, bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsQueryable();
        
        if (includePermissions)
        {
            query = query
                .Include(u => u.Permissions)
                .Include(u => u.Roles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.Permissions);
        }

        return await query.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<User>> GetAllAsync(bool includePermissions = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsQueryable();
        
        if (includePermissions)
        {
            query = query
                .Include(u => u.Permissions)
                .Include(u => u.Roles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.Permissions);
        }

        return await query
            .OrderBy(u => u.Email)
            .ToListAsync(cancellationToken);
    }

    public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<User?> GetOrCreateByEmailAsync(string email, string? name = null, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.ToLowerInvariant().Trim();
        var user = await GetByEmailAsync(normalizedEmail, cancellationToken);
        
        if (user == null)
        {
            // Create new user
            user = User.Create(normalizedEmail, name);
            await CreateAsync(user, cancellationToken);
        }
        else
        {
            // Update last login and name if provided
            user.UpdateLastLogin();
            if (name != null && user.Name != name)
            {
                user.UpdateName(name);
            }
            await UpdateAsync(user, cancellationToken);
        }
        
        return user;
    }
}

