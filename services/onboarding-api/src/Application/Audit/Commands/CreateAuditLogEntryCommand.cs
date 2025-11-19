using MediatR;
using OnboardingApi.Domain.Audit.ValueObjects;

namespace OnboardingApi.Application.Audit.Commands;

public record CreateAuditLogEntryCommand(
    string EventType,
    string EntityType,
    string EntityId,
    string UserId,
    string UserRole,
    AuditAction Action,
    string Description,
    string IpAddress,
    string UserAgent,
    string? CaseId = null,
    string? PartnerId = null,
    object? OldValues = null,
    object? NewValues = null,
    string? CorrelationId = null,
    AuditSeverity Severity = AuditSeverity.Medium,
    ComplianceCategory ComplianceCategory = ComplianceCategory.General) : IRequest<CreateAuditLogEntryResult>;

public record CreateAuditLogEntryResult(
    Guid EntryId,
    DateTime Timestamp,
    string Hash);

