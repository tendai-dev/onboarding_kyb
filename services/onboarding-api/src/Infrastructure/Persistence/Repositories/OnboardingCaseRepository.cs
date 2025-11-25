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
        // Case-insensitive lookup for case numbers
        return await _context.OnboardingCases
            .FirstOrDefaultAsync(c => c.CaseNumber.ToLower() == caseNumber.ToLower(), cancellationToken);
    }

    public async Task<IEnumerable<OnboardingCase>> GetByPartnerIdAsync(Guid partnerId, CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases
            .Where(c => c.PartnerId == partnerId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<OnboardingCase> Items, int TotalCount)> GetByPartnerIdWithFiltersAsync(
        Guid partnerId,
        int limit = 25,
        int offset = 0,
        string? status = null,
        string? assignee = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases
            .Where(c => c.PartnerId == partnerId);

        // Apply status filter
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<OnboardingStatus>(status, true, out var statusEnum))
            {
                query = query.Where(c => c.Status == statusEnum);
            }
        }

        // Apply assignee filter (if OnboardingCase has an Assignee property)
        // Note: This assumes there's an Assignee field. If not, this filter will be ignored.
        // You may need to adjust based on your actual domain model.
        if (!string.IsNullOrWhiteSpace(assignee))
        {
            // Uncomment if Assignee property exists:
            // query = query.Where(c => c.AssignedTo == assignee);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination and ordering
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
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

