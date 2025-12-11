using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class RequirementRepository : IRequirementRepository
{
    private readonly EntityConfigurationDbContext _context;
    private readonly ILogger<RequirementRepository> _logger;

    public RequirementRepository(EntityConfigurationDbContext context, ILogger<RequirementRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Requirement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Requirements
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<Requirement?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Requirements
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);
    }

    public async Task<List<Requirement>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Requirements.AsQueryable();
        
        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        return await query
            .OrderBy(r => r.DisplayName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Requirement requirement, CancellationToken cancellationToken = default)
    {
        await _context.Requirements.AddAsync(requirement, cancellationToken);
    }

    public async Task UpdateAsync(Requirement requirement, CancellationToken cancellationToken = default)
    {
        _context.Requirements.Update(requirement);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Requirement requirement, CancellationToken cancellationToken = default)
    {
        _context.Requirements.Remove(requirement);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var requirement = await GetByIdAsync(id, cancellationToken);
        if (requirement != null)
        {
            await DeleteAsync(requirement, cancellationToken);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

