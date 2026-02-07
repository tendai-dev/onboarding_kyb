using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.WorkQueue;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Service for detecting and reporting data integrity issues across schemas.
/// Identifies orphaned records, missing references, and inconsistent states.
/// </summary>
public interface IDataIntegrityService
{
    /// <summary>
    /// Runs all integrity checks and returns a report of issues found.
    /// </summary>
    Task<DataIntegrityReport> RunIntegrityChecksAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Checks for orphaned work items (work items without corresponding cases).
    /// </summary>
    Task<List<OrphanedRecordInfo>> FindOrphanedWorkItemsAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Checks for cases missing work items (submitted cases without work queue entries).
    /// </summary>
    Task<List<MissingRecordInfo>> FindCasesMissingWorkItemsAsync(CancellationToken cancellationToken = default);
}

public class DataIntegrityService : IDataIntegrityService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DataIntegrityService> _logger;

    public DataIntegrityService(
        IServiceScopeFactory scopeFactory,
        ILogger<DataIntegrityService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<DataIntegrityReport> RunIntegrityChecksAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting data integrity checks");
        var report = new DataIntegrityReport { CheckedAt = DateTime.UtcNow };

        try
        {
            report.OrphanedWorkItems = await FindOrphanedWorkItemsAsync(cancellationToken);
            report.CasesMissingWorkItems = await FindCasesMissingWorkItemsAsync(cancellationToken);
            
            report.TotalIssues = report.OrphanedWorkItems.Count + report.CasesMissingWorkItems.Count;
            
            if (report.TotalIssues > 0)
            {
                _logger.LogWarning(
                    "Data integrity check found {TotalIssues} issues: {OrphanedWorkItems} orphaned work items, {MissingWorkItems} cases missing work items",
                    report.TotalIssues, report.OrphanedWorkItems.Count, report.CasesMissingWorkItems.Count);
            }
            else
            {
                _logger.LogInformation("Data integrity check completed with no issues found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during data integrity check");
            report.Error = ex.Message;
        }

        return report;
    }

    public async Task<List<OrphanedRecordInfo>> FindOrphanedWorkItemsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var workQueueContext = scope.ServiceProvider.GetRequiredService<WorkQueueDbContext>();
        var onboardingContext = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();

        // Get all work item application IDs
        var workItemAppIds = await workQueueContext.WorkItems
            .Select(wi => wi.ApplicationId)
            .ToListAsync(cancellationToken);

        // Get all case IDs
        var caseIdsList = await onboardingContext.OnboardingCases
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);
        var caseIds = caseIdsList.ToHashSet();

        // Find orphaned work items (application ID doesn't exist in cases)
        var orphanedIds = workItemAppIds.Where(id => !caseIds.Contains(id)).ToList();

        if (orphanedIds.Count == 0)
            return new List<OrphanedRecordInfo>();

        // Get details of orphaned work items
        var orphanedWorkItems = await workQueueContext.WorkItems
            .Where(wi => orphanedIds.Contains(wi.ApplicationId))
            .Select(wi => new OrphanedRecordInfo
            {
                RecordId = wi.Id,
                RecordType = "WorkItem",
                Schema = "work_queue",
                MissingReferenceId = wi.ApplicationId,
                MissingReferenceType = "OnboardingCase",
                MissingReferenceSchema = "onboarding",
                CreatedAt = wi.CreatedAt,
                Details = $"Work item {wi.WorkItemNumber} references non-existent case"
            })
            .ToListAsync(cancellationToken);

        return orphanedWorkItems;
    }

    public async Task<List<MissingRecordInfo>> FindCasesMissingWorkItemsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var workQueueContext = scope.ServiceProvider.GetRequiredService<WorkQueueDbContext>();
        var onboardingContext = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();

        // Get submitted case IDs (cases that should have work items)
        // Status: Submitted=2, UnderReview=3, AdditionalInfoRequired=4
        var submittedCaseIds = await onboardingContext.OnboardingCases
            .Where(c => c.Status == Domain.Aggregates.OnboardingStatus.Submitted ||
                       c.Status == Domain.Aggregates.OnboardingStatus.UnderReview ||
                       c.Status == Domain.Aggregates.OnboardingStatus.AdditionalInfoRequired)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        // Get case IDs that have work items
        var workItemAppIdsList = await workQueueContext.WorkItems
            .Select(wi => wi.ApplicationId)
            .ToListAsync(cancellationToken);
        var caseIdsWithWorkItems = workItemAppIdsList.ToHashSet();

        // Find submitted cases without work items
        var missingWorkItemCaseIds = submittedCaseIds
            .Where(id => !caseIdsWithWorkItems.Contains(id))
            .ToList();

        if (missingWorkItemCaseIds.Count == 0)
            return new List<MissingRecordInfo>();

        // Get details of cases missing work items
        var casesMissingWorkItems = await onboardingContext.OnboardingCases
            .Where(c => missingWorkItemCaseIds.Contains(c.Id))
            .Select(c => new MissingRecordInfo
            {
                RecordId = c.Id,
                RecordType = "OnboardingCase",
                Schema = "onboarding",
                MissingRecordType = "WorkItem",
                MissingRecordSchema = "work_queue",
                CreatedAt = c.CreatedAt,
                Details = $"Submitted case {c.CaseNumber} (status: {c.Status}) has no work item"
            })
            .ToListAsync(cancellationToken);

        return casesMissingWorkItems;
    }
}

public class DataIntegrityReport
{
    public DateTime CheckedAt { get; set; }
    public int TotalIssues { get; set; }
    public List<OrphanedRecordInfo> OrphanedWorkItems { get; set; } = new();
    public List<MissingRecordInfo> CasesMissingWorkItems { get; set; } = new();
    public string? Error { get; set; }
}

public class OrphanedRecordInfo
{
    public Guid RecordId { get; set; }
    public string RecordType { get; set; } = string.Empty;
    public string Schema { get; set; } = string.Empty;
    public Guid MissingReferenceId { get; set; }
    public string MissingReferenceType { get; set; } = string.Empty;
    public string MissingReferenceSchema { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Details { get; set; } = string.Empty;
}

public class MissingRecordInfo
{
    public Guid RecordId { get; set; }
    public string RecordType { get; set; } = string.Empty;
    public string Schema { get; set; } = string.Empty;
    public string MissingRecordType { get; set; } = string.Empty;
    public string MissingRecordSchema { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Details { get; set; } = string.Empty;
}
