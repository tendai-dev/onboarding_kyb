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
    
    public async Task<WorkItem?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Get entity without owned collections to avoid concurrency issues
        return await _context.WorkItems
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
            // SECURITY FIX: Validate and sanitize search term to prevent injection
            if (searchTerm.Length > 100)
            {
                _logger.LogWarning("Search term too long: {Length} characters", searchTerm.Length);
                searchTerm = searchTerm.Substring(0, 100);
            }
            
            // SECURITY FIX: Remove potentially dangerous characters
            searchTerm = System.Text.RegularExpressions.Regex.Replace(searchTerm, @"[^\w\s-]", "");
            
            var search = searchTerm.ToLower();
            // Use EF.Functions.ILike for case-insensitive search that works with PostgreSQL
            // This ensures EF Core uses the correct column names from the mapping
            query = query.Where(w => 
                EF.Functions.ILike(w.ApplicantName, $"%{searchTerm}%") ||
                (w.BusinessName != null && EF.Functions.ILike(w.BusinessName, $"%{searchTerm}%")) ||
                EF.Functions.ILike(w.WorkItemNumber, $"%{searchTerm}%") ||
                EF.Functions.ILike(w.EntityType, $"%{searchTerm}%"));
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
        
        // Since we detach before loading, the entity should be tracked from GetByIdForUpdateAsync
        // If it's detached for some reason, attach it
        if (entry.State == EntityState.Detached)
        {
            _context.WorkItems.Attach(workItem);
        }
        
        // Force EF Core to detect changes (important for private setters)
        _context.ChangeTracker.DetectChanges();
        
        // Handle owned collections - mark new history entries as Added
        // Since we loaded the entity WITHOUT the History collection (GetByIdForUpdateAsync),
        // any history entries in the in-memory collection are new
        foreach (var historyEntry in workItem.History)
        {
            var historyEntryEntry = _context.Entry(historyEntry);
            
            // If the entry is not tracked, it's a new entry and should be marked as Added
            if (historyEntryEntry.State == EntityState.Detached)
            {
                // Mark as Added so EF Core will insert it
                historyEntryEntry.State = EntityState.Added;
            }
        }
        
        // After marking history entries, detect changes again to ensure entity state is correct
        _context.ChangeTracker.DetectChanges();
        
        // If entity is still Unchanged after detecting changes, it means EF Core didn't detect
        // the property changes (likely due to private setters). In this case, we need to
        // explicitly mark it as Modified, but only the properties that actually changed
        if (entry.State == EntityState.Unchanged)
        {
            // Mark only the properties we know changed as modified
            entry.Property(e => e.AssignedTo).IsModified = true;
            entry.Property(e => e.AssignedToName).IsModified = true;
            entry.Property(e => e.AssignedAt).IsModified = true;
            entry.Property(e => e.Status).IsModified = true;
            entry.Property(e => e.UpdatedAt).IsModified = true;
            entry.Property(e => e.UpdatedBy).IsModified = true;
        }
        
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(WorkItem workItem, CancellationToken cancellationToken = default)
    {
        _context.WorkItems.Remove(workItem);
        await Task.CompletedTask;
    }

    public async Task DeleteByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        var workItem = await GetByApplicationIdAsync(applicationId, cancellationToken);
        if (workItem != null)
        {
            _logger.LogInformation("Deleting work item {WorkItemId} for application {ApplicationId}", workItem.Id, applicationId);
            await DeleteAsync(workItem, cancellationToken);
        }
        else
        {
            _logger.LogDebug("No work item found for application {ApplicationId} - nothing to delete", applicationId);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
    
    public async Task DetachIfTrackedAsync(Guid workItemId, CancellationToken cancellationToken = default)
    {
        // Detach any existing tracked entity to ensure we get a fresh copy from the database
        // This prevents stale values that could cause concurrency conflicts
        var trackedEntity = _context.ChangeTracker.Entries<WorkItem>()
            .FirstOrDefault(e => e.Entity.Id == workItemId);
        if (trackedEntity != null)
        {
            trackedEntity.State = EntityState.Detached;
        }
        
        await Task.CompletedTask;
    }
    
    public async Task<int> UpdateAssignmentDirectlyAsync(
        Guid workItemId, 
        Guid assignedToUserId, 
        string assignedToUserName, 
        string assignedByUserId, 
        CancellationToken cancellationToken = default)
    {
        // Use ExecuteUpdate to update directly in the database without change tracking
        // This avoids concurrency issues completely
        // Status is stored as string, so we compare against string values
        var now = DateTime.UtcNow;
        var rowsAffected = await _context.WorkItems
            .Where(w => w.Id == workItemId 
                && w.Status != WorkItemStatus.Completed 
                && w.Status != WorkItemStatus.Declined 
                && w.Status != WorkItemStatus.Cancelled)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(w => w.AssignedTo, assignedToUserId)
                .SetProperty(w => w.AssignedToName, assignedToUserName)
                .SetProperty(w => w.AssignedAt, now)
                .SetProperty(w => w.Status, WorkItemStatus.Assigned)
                .SetProperty(w => w.UpdatedAt, now)
                .SetProperty(w => w.UpdatedBy, assignedByUserId),
                cancellationToken);
        
        _logger.LogInformation("ExecuteUpdate affected {RowsAffected} row(s) for work item {WorkItemId}", rowsAffected, workItemId);
        
        return rowsAffected;
    }
    
    public async Task<int> UpdateStatusDirectlyAsync(
        Guid workItemId,
        WorkItemStatus newStatus,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        // Use ExecuteUpdate to update directly in the database without change tracking
        // This avoids concurrency issues completely
        var now = DateTime.UtcNow;
        var rowsAffected = await _context.WorkItems
            .Where(w => w.Id == workItemId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(w => w.Status, newStatus)
                .SetProperty(w => w.UpdatedAt, now)
                .SetProperty(w => w.UpdatedBy, updatedBy),
                cancellationToken);
        
        _logger.LogInformation("ExecuteUpdate affected {RowsAffected} row(s) for work item {WorkItemId} status update to {Status}", 
            rowsAffected, workItemId, newStatus);
        
        return rowsAffected;
    }

    public async Task<int> CompleteDirectlyAsync(
        Guid workItemId,
        string completedBy,
        CancellationToken cancellationToken = default)
    {
        // Use ExecuteUpdate to complete the work item directly in the database without change tracking
        // This avoids concurrency issues with owned collections (Comments, History)
        var now = DateTime.UtcNow;
        var rowsAffected = await _context.WorkItems
            .Where(w => w.Id == workItemId 
                && w.Status != WorkItemStatus.Completed 
                && w.Status != WorkItemStatus.Declined 
                && w.Status != WorkItemStatus.Cancelled)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(w => w.Status, WorkItemStatus.Completed)
                .SetProperty(w => w.UpdatedAt, now)
                .SetProperty(w => w.UpdatedBy, completedBy),
                cancellationToken);
        
        _logger.LogInformation("ExecuteUpdate affected {RowsAffected} row(s) for work item {WorkItemId} completion", 
            rowsAffected, workItemId);
        
        return rowsAffected;
    }


    public async Task<int> ApproveDirectlyAsync(
        Guid workItemId,
        Guid approverId,
        string approverName,
        CancellationToken cancellationToken = default)
    {
        // Use ExecuteUpdate to approve the work item directly in the database without change tracking
        var now = DateTime.UtcNow;
        var rowsAffected = await _context.WorkItems
            .Where(w => w.Id == workItemId && w.Status == WorkItemStatus.PendingApproval)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(w => w.Status, WorkItemStatus.Approved)
                .SetProperty(w => w.ApprovedBy, approverId)
                .SetProperty(w => w.ApprovedByName, approverName)
                .SetProperty(w => w.ApprovedAt, now)
                .SetProperty(w => w.UpdatedAt, now)
                .SetProperty(w => w.UpdatedBy, approverName),
                cancellationToken);
        
        _logger.LogInformation("ExecuteUpdate affected {RowsAffected} row(s) for work item {WorkItemId} approval", 
            rowsAffected, workItemId);
        
        return rowsAffected;
    }

    
    public async Task AddHistoryEntryAsync(Guid workItemId, string action, string performedBy, string status, CancellationToken cancellationToken = default)
    {
        // SECURITY FIX: Validate all string inputs to prevent SQL injection
        if (string.IsNullOrWhiteSpace(action))
            throw new ArgumentException("Action cannot be null or empty", nameof(action));
        if (action.Length > 100)
            throw new ArgumentException("Action cannot exceed 100 characters", nameof(action));
        if (string.IsNullOrWhiteSpace(performedBy))
            throw new ArgumentException("PerformedBy cannot be null or empty", nameof(performedBy));
        if (performedBy.Length > 255)
            throw new ArgumentException("PerformedBy cannot exceed 255 characters", nameof(performedBy));
        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException("Status cannot be null or empty", nameof(status));
        if (status.Length > 50)
            throw new ArgumentException("Status cannot exceed 50 characters", nameof(status));

        // SECURITY FIX: Sanitize inputs - remove any potentially dangerous characters
        action = System.Text.RegularExpressions.Regex.Replace(action, @"[^\w\s-]", "");
        performedBy = System.Text.RegularExpressions.Regex.Replace(performedBy, @"[^\w\s@.-]", "");
        status = System.Text.RegularExpressions.Regex.Replace(status, @"[^\w\s-]", "");

        // Use parameterized query - safe from SQL injection when parameters are validated
        var sql = @"INSERT INTO work_queue.work_item_history (id, work_item_id, action, performed_by, performed_at, status)
                    VALUES (gen_random_uuid(), {0}, {1}, {2}, {3}, {4})";
        
        await _context.Database.ExecuteSqlRawAsync(
            sql,
            new object[] { workItemId, action, performedBy, DateTime.UtcNow, status },
            cancellationToken);
    }
    
    public async Task<WorkItemStepReview?> GetStepReviewAsync(Guid workItemId, string stepId, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItemStepReviews
            .FirstOrDefaultAsync(r => r.WorkItemId == workItemId && r.StepId == stepId, cancellationToken);
    }
    
    public async Task<List<WorkItemStepReview>> GetStepReviewsAsync(Guid workItemId, CancellationToken cancellationToken = default)
    {
        return await _context.WorkItemStepReviews
            .Where(r => r.WorkItemId == workItemId)
            .ToListAsync(cancellationToken);
    }
    
    public async Task AddOrUpdateStepReviewAsync(WorkItemStepReview review, CancellationToken cancellationToken = default)
    {
        var existing = await GetStepReviewAsync(review.WorkItemId, review.StepId, cancellationToken);
        
        if (existing == null)
        {
            await _context.WorkItemStepReviews.AddAsync(review, cancellationToken);
        }
        else
        {
            // Update existing review
            existing.Completed = review.Completed;
            existing.CompletedAt = review.CompletedAt;
            existing.CompletedBy = review.CompletedBy;
            existing.Verified = review.Verified;
            existing.VerifiedAt = review.VerifiedAt;
            existing.VerifiedBy = review.VerifiedBy;
            existing.Approved = review.Approved;
            existing.ApprovedAt = review.ApprovedAt;
            existing.ApprovedBy = review.ApprovedBy;
            existing.Notes = review.Notes;
            existing.UpdatedAt = review.UpdatedAt;
        }
    }
}

