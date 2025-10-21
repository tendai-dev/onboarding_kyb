using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Infrastructure.Persistence.Repositories;

/// <summary>
/// Repository implementation for OnboardingCase aggregate
/// </summary>
public class OnboardingCaseRepository : IOnboardingCaseRepository
{
    private readonly OnboardingDbContext _context;

    public IUnitOfWork UnitOfWork => _context;

    public OnboardingCaseRepository(OnboardingDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<OnboardingCase?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<OnboardingCase?> GetByCaseNumberAsync(string caseNumber, CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases
            .FirstOrDefaultAsync(c => c.CaseNumber == caseNumber, cancellationToken);
    }

    public async Task<IEnumerable<OnboardingCase>> GetByPartnerIdAsync(Guid partnerId, CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases
            .Where(c => c.PartnerId == partnerId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(OnboardingCase onboardingCase, CancellationToken cancellationToken = default)
    {
        await _context.OnboardingCases.AddAsync(onboardingCase, cancellationToken);
    }

    public void Update(OnboardingCase onboardingCase)
    {
        _context.Entry(onboardingCase).State = EntityState.Modified;
    }

    public void Delete(OnboardingCase onboardingCase)
    {
        _context.OnboardingCases.Remove(onboardingCase);
    }
}

