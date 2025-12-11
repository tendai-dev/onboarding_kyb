using OnboardingApi.Domain.Audit.Aggregates;
using OnboardingApi.Domain.Audit.ValueObjects;

namespace OnboardingApi.Application.Audit.Interfaces;

public interface IAuditLogRepository
{
    Task<AuditLogEntry?> GetByIdAsync(AuditLogEntryId id, CancellationToken cancellationToken = default);
    Task<List<AuditLogEntry>> GetByEntityAsync(string entityType, string entityId, CancellationToken cancellationToken = default);
    Task<List<AuditLogEntry>> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default);
    Task<List<AuditLogEntry>> GetByUserIdAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<List<AuditLogEntry>> GetByComplianceCategoryAsync(ComplianceCategory category, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<List<AuditLogEntry>> SearchAsync(AuditLogSearchCriteria criteria, CancellationToken cancellationToken = default);
    Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<bool> VerifyIntegrityAsync(AuditLogEntryId id, CancellationToken cancellationToken = default);
}

public class AuditLogSearchCriteria
{
    public string? EventType { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? CaseId { get; set; }
    public string? PartnerId { get; set; }
    public string? UserId { get; set; }
    public AuditAction? Action { get; set; }
    public AuditSeverity? Severity { get; set; }
    public ComplianceCategory? ComplianceCategory { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 100;
}

