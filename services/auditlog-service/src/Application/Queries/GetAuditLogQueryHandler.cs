using AuditLogService.Application.Interfaces;
using AuditLogService.Domain.ValueObjects;
using MediatR;

namespace AuditLogService.Application.Queries;

public class GetAuditLogQueryHandler : IRequestHandler<GetAuditLogQuery, AuditLogEntryDto?>
{
    private readonly IAuditLogRepository _repository;

    public GetAuditLogQueryHandler(IAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<AuditLogEntryDto?> Handle(GetAuditLogQuery request, CancellationToken cancellationToken)
    {
        var entry = await _repository.GetByIdAsync(AuditLogEntryId.From(request.EntryId), cancellationToken);
        if (entry == null)
            return null;

        var integrityVerified = await _repository.VerifyIntegrityAsync(entry.Id, cancellationToken);

        return MapToDto(entry, integrityVerified);
    }

    private static AuditLogEntryDto MapToDto(Domain.Aggregates.AuditLogEntry entry, bool integrityVerified)
    {
        return new AuditLogEntryDto
        {
            Id = entry.Id.Value,
            EventType = entry.EventType,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            CaseId = entry.CaseId,
            PartnerId = entry.PartnerId,
            UserId = entry.UserId,
            UserRole = entry.UserRole,
            Action = entry.Action.ToString(),
            Description = entry.Description,
            OldValues = entry.OldValues,
            NewValues = entry.NewValues,
            IpAddress = entry.IpAddress,
            UserAgent = entry.UserAgent,
            Timestamp = entry.Timestamp,
            CorrelationId = entry.CorrelationId,
            Severity = entry.Severity.ToString(),
            ComplianceCategory = entry.ComplianceCategory.ToString(),
            Hash = entry.Hash,
            IntegrityVerified = integrityVerified
        };
    }
}

public class GetAuditLogsByEntityQueryHandler : IRequestHandler<GetAuditLogsByEntityQuery, List<AuditLogEntryDto>>
{
    private readonly IAuditLogRepository _repository;

    public GetAuditLogsByEntityQueryHandler(IAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<AuditLogEntryDto>> Handle(GetAuditLogsByEntityQuery request, CancellationToken cancellationToken)
    {
        var entries = await _repository.GetByEntityAsync(request.EntityType, request.EntityId, cancellationToken);
        
        var result = new List<AuditLogEntryDto>();
        foreach (var entry in entries)
        {
            var integrityVerified = await _repository.VerifyIntegrityAsync(entry.Id, cancellationToken);
            result.Add(MapToDto(entry, integrityVerified));
        }

        return result;
    }

    private static AuditLogEntryDto MapToDto(Domain.Aggregates.AuditLogEntry entry, bool integrityVerified)
    {
        return new AuditLogEntryDto
        {
            Id = entry.Id.Value,
            EventType = entry.EventType,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            CaseId = entry.CaseId,
            PartnerId = entry.PartnerId,
            UserId = entry.UserId,
            UserRole = entry.UserRole,
            Action = entry.Action.ToString(),
            Description = entry.Description,
            OldValues = entry.OldValues,
            NewValues = entry.NewValues,
            IpAddress = entry.IpAddress,
            UserAgent = entry.UserAgent,
            Timestamp = entry.Timestamp,
            CorrelationId = entry.CorrelationId,
            Severity = entry.Severity.ToString(),
            ComplianceCategory = entry.ComplianceCategory.ToString(),
            Hash = entry.Hash,
            IntegrityVerified = integrityVerified
        };
    }
}

public class SearchAuditLogsQueryHandler : IRequestHandler<SearchAuditLogsQuery, AuditLogSearchResult>
{
    private readonly IAuditLogRepository _repository;

    public SearchAuditLogsQueryHandler(IAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<AuditLogSearchResult> Handle(SearchAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var entries = await _repository.SearchAsync(request.Criteria, cancellationToken);
        
        var dtos = new List<AuditLogEntryDto>();
        foreach (var entry in entries)
        {
            var integrityVerified = entry.VerifyIntegrity(); // Use domain method for bulk operations
            dtos.Add(new AuditLogEntryDto
            {
                Id = entry.Id.Value,
                EventType = entry.EventType,
                EntityType = entry.EntityType,
                EntityId = entry.EntityId,
                CaseId = entry.CaseId,
                PartnerId = entry.PartnerId,
                UserId = entry.UserId,
                UserRole = entry.UserRole,
                Action = entry.Action.ToString(),
                Description = entry.Description,
                OldValues = entry.OldValues,
                NewValues = entry.NewValues,
                IpAddress = entry.IpAddress,
                UserAgent = entry.UserAgent,
                Timestamp = entry.Timestamp,
                CorrelationId = entry.CorrelationId,
                Severity = entry.Severity.ToString(),
                ComplianceCategory = entry.ComplianceCategory.ToString(),
                Hash = entry.Hash,
                IntegrityVerified = integrityVerified
            });
        }

        return new AuditLogSearchResult
        {
            Entries = dtos,
            TotalCount = entries.Count, // In real implementation, this would be a separate count query
            Skip = request.Criteria.Skip,
            Take = request.Criteria.Take
        };
    }
}
