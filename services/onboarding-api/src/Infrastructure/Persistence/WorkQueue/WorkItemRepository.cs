using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Domain.WorkQueue.Aggregates;
using OnboardingApi.Domain.WorkQueue.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.WorkQueue;

namespace OnboardingApi.Infrastructure.Persistence.WorkQueue;

public class WorkItemRepository : IWorkItemRepository
{
    private readonly WorkQueueDbContext _context;
    private readonly ILogger<WorkItemRepository> _logger;

    public WorkItemRepository(WorkQueueDbContext context, ILogger<WorkItemRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WorkItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .Include(w => w.Comments)
            .Include(w => w.History)
            .AsTracking()
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<WorkItem?> GetByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .Include(w => w.Comments)
            .Include(w => w.History)
            .AsTracking()
            .FirstOrDefaultAsync(w => w.ApplicationId == applicationId, cancellationToken);
    }

    public async Task<List<WorkItem>> GetAllAsync(
        WorkItemStatus? status = null,
        Guid? assignedTo = null,
        RiskLevel? riskLevel = null,
        string? country = null,
        bool? isOverdue = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkItems
            .Include(w => w.Comments)
            .Include(w => w.History)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(w => w.Status == status.Value);

        if (assignedTo.HasValue)
            query = query.Where(w => w.AssignedTo == assignedTo.Value);

        if (riskLevel.HasValue)
            query = query.Where(w => w.RiskLevel == riskLevel.Value);

        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(w => w.Country == country);

        if (isOverdue.HasValue && isOverdue.Value)
            query = query.Where(w => w.IsOverdue);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var search = searchTerm.ToLower();
            query = query.Where(w => 
                w.ApplicantName.ToLower().Contains(search) ||
                w.WorkItemNumber.ToLower().Contains(search) ||
                w.EntityType.ToLower().Contains(search));
        }

        return await query
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WorkItem>> GetByAssignedUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItems
            .Include(w => w.Comments)
            .Include(w => w.History)
            .Where(w => w.AssignedTo == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WorkItem>> GetPendingApprovalsAsync(RiskLevel? minimumRiskLevel = null, CancellationToken cancellationToken = default)
    {
        var query = _context.WorkItems
            .Include(w => w.Comments)
            .Include(w => w.History)
            .Where(w => w.Status == WorkItemStatus.PendingApproval);

        if (minimumRiskLevel.HasValue)
        {
            query = query.Where(w => w.RiskLevel >= minimumRiskLevel.Value);
        }

        return await query
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WorkItem>> GetItemsDueForRefreshAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        var checkDate = asOfDate ?? DateTime.UtcNow;
        
        return await _context.WorkItems
            .Include(w => w.Comments)
            .Include(w => w.History)
            .Where(w => w.Status == WorkItemStatus.DueForRefresh ||
                       (w.NextRefreshDate.HasValue && w.NextRefreshDate.Value <= checkDate))
            .OrderBy(w => w.NextRefreshDate)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        await _context.WorkItems.AddAsync(workItem, cancellationToken);
    }

    public async Task UpdateAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        var entry = _context.Entry(workItem);
        
        if (entry.State == EntityState.Detached)
        {
            _context.WorkItems.Update(workItem);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

