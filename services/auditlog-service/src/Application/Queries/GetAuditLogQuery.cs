using AuditLogService.Application.Interfaces;
using AuditLogService.Domain.ValueObjects;
using MediatR;

namespace AuditLogService.Application.Queries;

public record GetAuditLogQuery(Guid EntryId) : IRequest<AuditLogEntryDto?>;

public record GetAuditLogsByEntityQuery(string EntityType, string EntityId) : IRequest<List<AuditLogEntryDto>>;

public record GetAuditLogsByCaseQuery(string CaseId) : IRequest<List<AuditLogEntryDto>>;

public record SearchAuditLogsQuery(AuditLogSearchCriteria Criteria) : IRequest<AuditLogSearchResult>;

public class AuditLogEntryDto
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? CaseId { get; set; }
    public string? PartnerId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? CorrelationId { get; set; }
    public string Severity { get; set; } = string.Empty;
    public string ComplianceCategory { get; set; } = string.Empty;
    public string Hash { get; set; } = string.Empty;
    public bool IntegrityVerified { get; set; }
}

public class AuditLogSearchResult
{
    public List<AuditLogEntryDto> Entries { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
}
