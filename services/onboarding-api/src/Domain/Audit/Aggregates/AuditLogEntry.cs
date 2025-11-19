using OnboardingApi.Domain.Audit.ValueObjects;
using System.Text.Json;

namespace OnboardingApi.Domain.Audit.Aggregates;

/// <summary>
/// Immutable audit log entry for compliance and regulatory requirements
/// </summary>
public class AuditLogEntry
{
    public AuditLogEntryId Id { get; private set; }
    public string EventType { get; private set; }
    public string EntityType { get; private set; }
    public string EntityId { get; private set; }
    public string? CaseId { get; private set; }
    public string? PartnerId { get; private set; }
    public string UserId { get; private set; }
    public string UserRole { get; private set; }
    public AuditAction Action { get; private set; }
    public string Description { get; private set; }
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string IpAddress { get; private set; }
    public string UserAgent { get; private set; }
    public DateTime Timestamp { get; private set; }
    public string? CorrelationId { get; private set; }
    public AuditSeverity Severity { get; private set; }
    public ComplianceCategory ComplianceCategory { get; private set; }
    public string Hash { get; private set; }

    private AuditLogEntry() { } // EF Core

    public static AuditLogEntry Create(
        string eventType,
        string entityType,
        string entityId,
        string userId,
        string userRole,
        AuditAction action,
        string description,
        string ipAddress,
        string userAgent,
        string? caseId = null,
        string? partnerId = null,
        object? oldValues = null,
        object? newValues = null,
        string? correlationId = null,
        AuditSeverity severity = AuditSeverity.Medium,
        ComplianceCategory complianceCategory = ComplianceCategory.General)
    {
        if (string.IsNullOrWhiteSpace(eventType))
            throw new ArgumentException("Event type cannot be null or empty", nameof(eventType));
        if (string.IsNullOrWhiteSpace(entityType))
            throw new ArgumentException("Entity type cannot be null or empty", nameof(entityType));
        if (string.IsNullOrWhiteSpace(entityId))
            throw new ArgumentException("Entity ID cannot be null or empty", nameof(entityId));
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));

        var entry = new AuditLogEntry
        {
            Id = AuditLogEntryId.New(),
            EventType = eventType,
            EntityType = entityType,
            EntityId = entityId,
            CaseId = caseId,
            PartnerId = partnerId,
            UserId = userId,
            UserRole = userRole,
            Action = action,
            Description = description,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Timestamp = DateTime.UtcNow,
            CorrelationId = correlationId,
            Severity = severity,
            ComplianceCategory = complianceCategory
        };

        // Generate integrity hash
        entry.Hash = entry.GenerateHash();

        return entry;
    }

    /// <summary>
    /// Verify the integrity of this audit log entry
    /// </summary>
    public bool VerifyIntegrity()
    {
        var expectedHash = GenerateHash();
        return Hash == expectedHash;
    }

    /// <summary>
    /// Generate SHA-256 hash for integrity verification
    /// </summary>
    private string GenerateHash()
    {
        var data = $"{Id.Value}|{EventType}|{EntityType}|{EntityId}|{UserId}|{Action}|{Timestamp:O}|{Description}|{OldValues}|{NewValues}";
        
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// Get sanitized values for logging (removes PII)
    /// </summary>
    public object GetSanitizedValues()
    {
        return new
        {
            Id = Id.Value,
            EventType,
            EntityType,
            EntityId = MaskSensitiveData(EntityId),
            CaseId,
            PartnerId,
            UserId = MaskSensitiveData(UserId),
            UserRole,
            Action = Action.ToString(),
            Description,
            IpAddress = MaskIpAddress(IpAddress),
            Timestamp,
            CorrelationId,
            Severity = Severity.ToString(),
            ComplianceCategory = ComplianceCategory.ToString()
        };
    }

    private static string MaskSensitiveData(string data)
    {
        if (string.IsNullOrEmpty(data) || data.Length <= 4)
            return "****";
        
        return data[..2] + new string('*', data.Length - 4) + data[^2..];
    }

    private static string MaskIpAddress(string ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress))
            return "0.0.0.0";

        var parts = ipAddress.Split('.');
        if (parts.Length == 4)
            return $"{parts[0]}.{parts[1]}.*.***";
        
        return "masked";
    }
}

