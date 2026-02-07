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

    public async Task<Dictionary<Guid, OnboardingCase>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.Distinct().ToList();
        if (idList.Count == 0)
            return new Dictionary<Guid, OnboardingCase>();

        // Single query to fetch all cases by IDs - prevents N+1
        var cases = await _context.OnboardingCases
            .Where(c => idList.Contains(c.Id))
            .ToListAsync(cancellationToken);

        return cases.ToDictionary(c => c.Id, c => c);
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

    public async Task<int> DeleteAllAsync(CancellationToken cancellationToken = default)
    {
        var count = await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM onboarding.onboarding_cases", cancellationToken);
        return count;
    }

    public async Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.OnboardingCases.CountAsync(cancellationToken);
    }

    public async Task<(IEnumerable<OnboardingCase> Items, int TotalCount)> QueryAsync(
        CaseQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases.AsQueryable();

        // Apply filters
        if (parameters.PartnerId.HasValue)
        {
            query = query.Where(c => c.PartnerId == parameters.PartnerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Status) && 
            Enum.TryParse<OnboardingStatus>(parameters.Status, true, out var statusEnum))
        {
            query = query.Where(c => c.Status == statusEnum);
        }

        if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
        {
            var term = parameters.SearchTerm.ToLower();
            query = query.Where(c => 
                c.CaseNumber.ToLower().Contains(term) ||
                c.Applicant.FirstName.ToLower().Contains(term) ||
                c.Applicant.LastName.ToLower().Contains(term) ||
                c.Applicant.Email.ToLower().Contains(term) ||
                (c.Business != null && c.Business.LegalName.ToLower().Contains(term)));
        }

        if (parameters.FromDate.HasValue)
        {
            query = query.Where(c => c.CreatedAt >= parameters.FromDate.Value);
        }

        if (parameters.ToDate.HasValue)
        {
            query = query.Where(c => c.CreatedAt <= parameters.ToDate.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = parameters.SortBy?.ToLower() switch
        {
            "createdat" => parameters.SortDirection?.ToLower() == "asc" 
                ? query.OrderBy(c => c.CreatedAt) 
                : query.OrderByDescending(c => c.CreatedAt),
            "updatedat" => parameters.SortDirection?.ToLower() == "asc" 
                ? query.OrderBy(c => c.UpdatedAt) 
                : query.OrderByDescending(c => c.UpdatedAt),
            "status" => parameters.SortDirection?.ToLower() == "asc" 
                ? query.OrderBy(c => c.Status) 
                : query.OrderByDescending(c => c.Status),
            "casenumber" => parameters.SortDirection?.ToLower() == "asc" 
                ? query.OrderBy(c => c.CaseNumber) 
                : query.OrderByDescending(c => c.CaseNumber),
            _ => query.OrderByDescending(c => c.CreatedAt)
        };

        // Apply pagination
        var items = await query
            .Skip(parameters.Skip)
            .Take(parameters.Take)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IEnumerable<OnboardingCase>> GetCasesRequiringAttentionAsync(
        Guid? partnerId = null,
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OnboardingCases
            .Where(c => c.Status == OnboardingStatus.UnderReview || 
                       c.Status == OnboardingStatus.Submitted);

        if (partnerId.HasValue)
        {
            query = query.Where(c => c.PartnerId == partnerId.Value);
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<OnboardingCase?> GetByIdOrCaseNumberAsync(string identifier, CancellationToken cancellationToken = default)
    {
        if (Guid.TryParse(identifier, out var guid))
        {
            return await _context.OnboardingCases.FirstOrDefaultAsync(c => c.Id == guid, cancellationToken);
        }
        
        return await _context.OnboardingCases.FirstOrDefaultAsync(
            c => c.CaseNumber.ToLower() == identifier.ToLower(), cancellationToken);
    }
}

