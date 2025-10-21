using AuditLogService.Application.Interfaces;
using AuditLogService.Domain.Aggregates;
using AuditLogService.Domain.ValueObjects;
using AuditLogService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AuditLogService.Infrastructure.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AuditLogDbContext _context;

    public AuditLogRepository(AuditLogDbContext context)
    {
        _context = context;
    }

    public async Task<AuditLogEntry?> GetByIdAsync(AuditLogEntryId id, CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<List<AuditLogEntry>> GetByEntityAsync(string entityType, string entityId, CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogEntries
            .AsNoTracking()
            .Where(e => e.EntityType == entityType && e.EntityId == entityId)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<AuditLogEntry>> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogEntries
            .AsNoTracking()
            .Where(e => e.CaseId == caseId)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<AuditLogEntry>> GetByUserIdAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogEntries
            .AsNoTracking()
            .Where(e => e.UserId == userId);

        if (fromDate.HasValue)
            query = query.Where(e => e.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.Timestamp <= toDate.Value);

        return await query
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<AuditLogEntry>> GetByComplianceCategoryAsync(ComplianceCategory category, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogEntries
            .AsNoTracking()
            .Where(e => e.ComplianceCategory == category);

        if (fromDate.HasValue)
            query = query.Where(e => e.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.Timestamp <= toDate.Value);

        return await query
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<AuditLogEntry>> SearchAsync(AuditLogSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogEntries.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(criteria.EventType))
            query = query.Where(e => e.EventType == criteria.EventType);

        if (!string.IsNullOrEmpty(criteria.EntityType))
            query = query.Where(e => e.EntityType == criteria.EntityType);

        if (!string.IsNullOrEmpty(criteria.EntityId))
            query = query.Where(e => e.EntityId == criteria.EntityId);

        if (!string.IsNullOrEmpty(criteria.CaseId))
            query = query.Where(e => e.CaseId == criteria.CaseId);

        if (!string.IsNullOrEmpty(criteria.PartnerId))
            query = query.Where(e => e.PartnerId == criteria.PartnerId);

        if (!string.IsNullOrEmpty(criteria.UserId))
            query = query.Where(e => e.UserId == criteria.UserId);

        if (criteria.Action.HasValue)
            query = query.Where(e => e.Action == criteria.Action.Value);

        if (criteria.Severity.HasValue)
            query = query.Where(e => e.Severity == criteria.Severity.Value);

        if (criteria.ComplianceCategory.HasValue)
            query = query.Where(e => e.ComplianceCategory == criteria.ComplianceCategory.Value);

        if (criteria.FromDate.HasValue)
            query = query.Where(e => e.Timestamp >= criteria.FromDate.Value);

        if (criteria.ToDate.HasValue)
            query = query.Where(e => e.Timestamp <= criteria.ToDate.Value);

        return await query
            .OrderByDescending(e => e.Timestamp)
            .Skip(criteria.Skip)
            .Take(criteria.Take)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken = default)
    {
        await _context.AuditLogEntries.AddAsync(entry, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> VerifyIntegrityAsync(AuditLogEntryId id, CancellationToken cancellationToken = default)
    {
        var entry = await GetByIdAsync(id, cancellationToken);
        return entry?.VerifyIntegrity() ?? false;
    }
}
