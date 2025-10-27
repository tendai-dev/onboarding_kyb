using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Commands;
using OnboardingApi.Infrastructure.Persistence;

namespace OnboardingApi.Infrastructure.Persistence.Repositories;

public class ApplicationRepository : IApplicationRepository
{
    private readonly OnboardingDbContext _context;

    public ApplicationRepository(OnboardingDbContext context)
    {
        _context = context;
    }

    public async Task<List<OnboardingApi.Application.Commands.Application>> GetApplicationsByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.Applications
            .Where(a => a.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task UpdateAsync(OnboardingApi.Application.Commands.Application application, CancellationToken cancellationToken)
    {
        _context.Applications.Update(application);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
