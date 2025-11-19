using AuditLogService.Application.Commands;
using AuditLogService.Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace AuditLogService.Application.EventHandlers;

/// <summary>
/// Handles domain events from Kafka and creates audit log entries
/// </summary>
public class DomainEventAuditLogHandler
{
    private readonly IMediator _mediator;
    private readonly ILogger<DomainEventAuditLogHandler> _logger;

    public DomainEventAuditLogHandler(
        IMediator mediator,
        ILogger<DomainEventAuditLogHandler> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task HandleDomainEventAsync(string eventType, string eventPayload, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Processing domain event {EventType}", eventType);

            AuditAction action;
            string entityType;
            string entityId;
            string description;
            string? caseId = null;
            string? partnerId = null;
            string userId = "system";
            string userRole = "system";
            AuditSeverity severity = AuditSeverity.Medium;
            ComplianceCategory category = ComplianceCategory.KYB;
            object? oldValues = null;
            object? newValues = null;

            // Parse the event payload
            using var doc = JsonDocument.Parse(eventPayload);
            var root = doc.RootElement;

            // Map event types to audit log entries
            switch (eventType)
            {
                case "OnboardingCaseCreatedEvent":
                    entityType = "OnboardingCase";
                    entityId = root.GetProperty("CaseId").GetString() ?? Guid.Empty.ToString();
                    caseId = entityId;
                    partnerId = root.TryGetProperty("PartnerId", out var partnerIdProp) 
                        ? partnerIdProp.GetString() 
                        : null;
                    action = AuditAction.Create;
                    description = $"Onboarding case {root.GetProperty("CaseNumber").GetString()} created (Type: {root.GetProperty("Type").GetString()})";
                    userId = root.TryGetProperty("CreatedBy", out var createdByProp) 
                        ? createdByProp.GetString() ?? "system" 
                        : "system";
                    category = ComplianceCategory.KYB;
                    break;

                case "OnboardingCaseSubmittedEvent":
                    entityType = "OnboardingCase";
                    entityId = root.GetProperty("CaseId").GetString() ?? Guid.Empty.ToString();
                    caseId = entityId;
                    partnerId = root.TryGetProperty("PartnerId", out var partnerId2) 
                        ? partnerId2.GetString() 
                        : null;
                    action = AuditAction.Submit;
                    description = $"Onboarding case {root.GetProperty("CaseNumber").GetString()} submitted for processing";
                    userId = "system"; // Could extract from event if available
                    category = ComplianceCategory.KYB;
                    break;

                case "OnboardingCaseApprovedEvent":
                    entityType = "OnboardingCase";
                    entityId = root.GetProperty("CaseId").GetString() ?? Guid.Empty.ToString();
                    caseId = entityId;
                    partnerId = root.TryGetProperty("PartnerId", out var partnerId3) 
                        ? partnerId3.GetString() 
                        : null;
                    action = AuditAction.Approve;
                    description = $"Onboarding case {root.GetProperty("CaseNumber").GetString()} approved";
                    userId = root.TryGetProperty("ApprovedBy", out var approvedByProp) 
                        ? approvedByProp.GetString() ?? "system" 
                        : "system";
                    category = ComplianceCategory.KYB;
                    severity = AuditSeverity.High;
                    break;

                case "OnboardingCaseRejectedEvent":
                    entityType = "OnboardingCase";
                    entityId = root.GetProperty("CaseId").GetString() ?? Guid.Empty.ToString();
                    caseId = entityId;
                    partnerId = root.TryGetProperty("PartnerId", out var partnerId4) 
                        ? partnerId4.GetString() 
                        : null;
                    action = AuditAction.Reject;
                    description = $"Onboarding case {root.GetProperty("CaseNumber").GetString()} rejected. Reason: {root.GetProperty("Reason").GetString()}";
                    userId = "system";
                    category = ComplianceCategory.KYB;
                    severity = AuditSeverity.High;
                    break;

                case "OnboardingCaseUpdatedEvent":
                    entityType = "OnboardingCase";
                    entityId = root.GetProperty("CaseId").GetString() ?? Guid.Empty.ToString();
                    caseId = entityId;
                    action = AuditAction.Update;
                    description = $"Onboarding case {root.GetProperty("CaseNumber").GetString()} updated. Field: {root.GetProperty("UpdatedField").GetString()}";
                    userId = "system";
                    category = ComplianceCategory.KYB;
                    break;

                case "AdditionalInfoRequestedEvent":
                    entityType = "OnboardingCase";
                    entityId = root.GetProperty("CaseId").GetString() ?? Guid.Empty.ToString();
                    caseId = entityId;
                    action = AuditAction.Update;
                    description = $"Additional information requested for case {root.GetProperty("CaseNumber").GetString()}: {root.GetProperty("Message").GetString()}";
                    userId = "system";
                    category = ComplianceCategory.KYB;
                    break;

                // Message events
                case "MessageSentEvent":
                    entityType = "Message";
                    entityId = root.TryGetProperty("MessageId", out var msgId) 
                        ? msgId.GetString() ?? Guid.NewGuid().ToString() 
                        : Guid.NewGuid().ToString();
                    caseId = root.TryGetProperty("ApplicationId", out var appId) 
                        ? appId.GetString() 
                        : null;
                    action = AuditAction.Send;
                    description = "Message sent";
                    userId = root.TryGetProperty("SenderId", out var senderId) 
                        ? senderId.GetString() ?? "system" 
                        : "system";
                    category = ComplianceCategory.Communication;
                    break;

                // Risk assessment events
                case "RiskAssessmentCompletedEvent":
                    entityType = "RiskAssessment";
                    entityId = root.TryGetProperty("AssessmentId", out var assessId) 
                        ? assessId.GetString() ?? Guid.NewGuid().ToString() 
                        : Guid.NewGuid().ToString();
                    caseId = root.TryGetProperty("CaseId", out var caseIdProp) 
                        ? caseIdProp.GetString() 
                        : null;
                    partnerId = root.TryGetProperty("PartnerId", out var partnerId5) 
                        ? partnerId5.GetString() 
                        : null;
                    action = AuditAction.Execute;
                    description = $"Risk assessment completed. Risk Level: {root.GetProperty("RiskLevel").GetString()}, Score: {root.GetProperty("RiskScore").GetDecimal()}";
                    userId = root.TryGetProperty("AssessedBy", out var assessedBy) 
                        ? assessedBy.GetString() ?? "system" 
                        : "system";
                    category = ComplianceCategory.RiskManagement;
                    severity = root.TryGetProperty("RiskLevel", out var riskLevel) && 
                               riskLevel.GetString()?.Contains("High") == true 
                        ? AuditSeverity.High 
                        : AuditSeverity.Medium;
                    break;

                // Default case for unknown events
                default:
                    _logger.LogWarning("Unknown event type {EventType}, creating generic audit log entry", eventType);
                    entityType = "Unknown";
                    entityId = Guid.NewGuid().ToString();
                    action = AuditAction.Other;
                    description = $"Domain event {eventType} occurred";
                    category = ComplianceCategory.General;
                    break;
            }

            // Create audit log entry
            var command = new CreateAuditLogEntryCommand(
                EventType: eventType,
                EntityType: entityType,
                EntityId: entityId,
                UserId: userId,
                UserRole: userRole,
                Action: action,
                Description: description,
                IpAddress: "unknown", // Events from Kafka don't have IP
                UserAgent: "kafka-consumer",
                CaseId: caseId,
                PartnerId: partnerId,
                OldValues: oldValues,
                NewValues: newValues,
                CorrelationId: null,
                Severity: severity,
                ComplianceCategory: category
            );

            await _mediator.Send(command, cancellationToken);
            _logger.LogInformation("Created audit log entry for event {EventType}, entity {EntityType}/{EntityId}", 
                eventType, entityType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process domain event {EventType}", eventType);
            // Don't throw - we don't want to crash the consumer for audit log failures
        }
    }
}

