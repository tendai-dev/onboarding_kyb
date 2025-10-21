using AuditLogService.Application.Interfaces;
using AuditLogService.Domain.Aggregates;
using MediatR;

namespace AuditLogService.Application.Commands;

public class CreateAuditLogEntryCommandHandler : IRequestHandler<CreateAuditLogEntryCommand, CreateAuditLogEntryResult>
{
    private readonly IAuditLogRepository _repository;
    private readonly ILogger<CreateAuditLogEntryCommandHandler> _logger;

    public CreateAuditLogEntryCommandHandler(
        IAuditLogRepository repository,
        ILogger<CreateAuditLogEntryCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<CreateAuditLogEntryResult> Handle(CreateAuditLogEntryCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Create immutable audit log entry
            var entry = AuditLogEntry.Create(
                request.EventType,
                request.EntityType,
                request.EntityId,
                request.UserId,
                request.UserRole,
                request.Action,
                request.Description,
                request.IpAddress,
                request.UserAgent,
                request.CaseId,
                request.PartnerId,
                request.OldValues,
                request.NewValues,
                request.CorrelationId,
                request.Severity,
                request.ComplianceCategory);

            // Store in repository (append-only)
            await _repository.AddAsync(entry, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            // Log sanitized version for monitoring
            _logger.LogInformation("Audit log entry created: {@AuditEntry}", entry.GetSanitizedValues());

            return new CreateAuditLogEntryResult(
                entry.Id.Value,
                entry.Timestamp,
                entry.Hash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit log entry for {EventType} on {EntityType}:{EntityId}", 
                request.EventType, request.EntityType, request.EntityId);
            throw;
        }
    }
}
