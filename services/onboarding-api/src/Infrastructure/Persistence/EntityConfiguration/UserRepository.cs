using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class UserRepository : IUserRepository
{
    private readonly EntityConfigurationDbContext _context;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(EntityConfigurationDbContext context, ILogger<UserRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.RoleAssignments)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        
        if (user != null)
        {
            await _context.Entry(user)
                .Collection(u => u.Permissions)
                .LoadAsync(cancellationToken);
            await _context.Entry(user)
                .Collection(u => u.RoleAssignments)
                .LoadAsync(cancellationToken);
        }
        
        return user;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.RoleAssignments)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        
        if (user != null)
        {
            await _context.Entry(user)
                .Collection(u => u.Permissions)
                .LoadAsync(cancellationToken);
            await _context.Entry(user)
                .Collection(u => u.RoleAssignments)
                .LoadAsync(cancellationToken);
        }
        
        return user;
    }

    public async Task<List<User>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Users
            .Include(u => u.Permissions)
            .Include(u => u.RoleAssignments)
            .AsQueryable();
        
        // Note: User doesn't have IsActive, but RoleAssignments do
        // Filter by active role assignments if needed
        if (!includeInactive)
        {
            // Only include users with at least one active role assignment
            query = query.Where(u => u.RoleAssignments.Any(r => r.IsActive));
        }
        
        var users = await query.ToListAsync(cancellationToken);
        
        // Explicitly load collections for all users
        foreach (var user in users)
        {
            await _context.Entry(user)
                .Collection(u => u.Permissions)
                .LoadAsync(cancellationToken);
            await _context.Entry(user)
                .Collection(u => u.RoleAssignments)
                .LoadAsync(cancellationToken);
        }
        
        return users;
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
    }

    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Remove(user);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(id, cancellationToken);
        if (user != null)
        {
            await DeleteAsync(user, cancellationToken);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

