using Microsoft.Extensions.Logging;
using NotificationService.Application.Interfaces;
using NotificationService.Domain.Events;

namespace NotificationService.Application.EventHandlers;

/// <summary>
/// Handles RiskAssessedEvent from Risk Service
/// Sends compliance alerts when high-risk applications are detected
/// </summary>
public class RiskAssessedEventHandler
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<RiskAssessedEventHandler> _logger;
    private readonly ComplianceAlertOptions _options;
    
    public RiskAssessedEventHandler(
        INotificationService notificationService,
        ILogger<RiskAssessedEventHandler> logger,
        Microsoft.Extensions.Options.IOptions<ComplianceAlertOptions> options)
    {
        _notificationService = notificationService;
        _logger = logger;
        _options = options.Value;
    }
    
    public async Task HandleAsync(RiskAssessedEvent riskEvent, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation(
                "Processing RiskAssessedEvent: ApplicationId={ApplicationId}, RiskLevel={RiskLevel}",
                riskEvent.ApplicationId, riskEvent.RiskLevel);
            
            // Check if risk level requires compliance notification
            if (ShouldNotifyCompliance(riskEvent.RiskLevel))
            {
                await SendComplianceAlertAsync(riskEvent, cancellationToken);
            }
            
            // Also notify applicant if declined
            if (riskEvent.IsDeclined)
            {
                await SendApplicantNotificationAsync(riskEvent, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error handling RiskAssessedEvent for ApplicationId={ApplicationId}",
                riskEvent.ApplicationId);
            throw;
        }
    }
    
    private bool ShouldNotifyCompliance(RiskLevel riskLevel)
    {
        return riskLevel is RiskLevel.High or RiskLevel.Critical;
    }
    
    private async Task SendComplianceAlertAsync(RiskAssessedEvent riskEvent, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Sending compliance alert for high-risk application: {ApplicationId}",
            riskEvent.ApplicationId);
        
        // Prepare comprehensive compliance alert data
        var emailData = new ComplianceAlertEmailData
        {
            ApplicationId = riskEvent.ApplicationId,
            ApplicantName = riskEvent.ApplicantName,
            EntityType = riskEvent.EntityType,
            Country = riskEvent.Country,
            RiskLevel = riskEvent.RiskLevel.ToString(),
            RiskScore = riskEvent.RiskScore,
            RiskFactors = riskEvent.RiskFactors,
            AssessedAt = riskEvent.AssessedAt,
            ReviewUrl = $"{_options.ApplicationBaseUrl}/admin/applications/{riskEvent.ApplicationId}",
            Documents = riskEvent.DocumentSummary,
            ComplianceNotes = riskEvent.ComplianceNotes
        };
        
        // Send email to compliance team
        await _notificationService.SendEmailAsync(
            to: _options.ComplianceTeamEmail,
            subject: $"[{riskEvent.RiskLevel.ToString().ToUpper()}] Compliance Review Required - {riskEvent.ApplicantName}",
            templateName: "ComplianceAlert",
            data: emailData,
            cancellationToken: cancellationToken
        );
        
        _logger.LogInformation(
            "Compliance alert sent successfully: ApplicationId={ApplicationId}, Recipients={Recipients}",
            riskEvent.ApplicationId, _options.ComplianceTeamEmail);
        
        // Also trigger webhook to external compliance systems if configured
        if (!string.IsNullOrEmpty(_options.WebhookUrl))
        {
            await SendComplianceWebhookAsync(riskEvent, cancellationToken);
        }
    }
    
    private async Task SendComplianceWebhookAsync(RiskAssessedEvent riskEvent, CancellationToken cancellationToken)
    {
        try
        {
            var webhookPayload = new
            {
                eventType = "RiskAssessed",
                applicationId = riskEvent.ApplicationId,
                applicantName = riskEvent.ApplicantName,
                entityType = riskEvent.EntityType,
                country = riskEvent.Country,
                riskLevel = riskEvent.RiskLevel.ToString(),
                riskScore = riskEvent.RiskScore,
                riskFactors = riskEvent.RiskFactors,
                assessedAt = riskEvent.AssessedAt,
                requiresReview = true
            };
            
            await _notificationService.SendWebhookAsync(
                url: _options.WebhookUrl,
                payload: webhookPayload,
                cancellationToken: cancellationToken
            );
            
            _logger.LogInformation(
                "Compliance webhook sent successfully: ApplicationId={ApplicationId}",
                riskEvent.ApplicationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error sending compliance webhook for ApplicationId={ApplicationId}",
                riskEvent.ApplicationId);
            // Don't throw - webhook failure shouldn't block email notification
        }
    }
    
    private async Task SendApplicantNotificationAsync(RiskAssessedEvent riskEvent, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(riskEvent.ApplicantEmail))
            return;
        
        try
        {
            var emailData = new
            {
                ApplicantName = riskEvent.ApplicantName,
                ApplicationId = riskEvent.ApplicationId,
                DeclineReason = riskEvent.DeclineReason
            };
            
            await _notificationService.SendEmailAsync(
                to: riskEvent.ApplicantEmail,
                subject: "Application Status Update",
                templateName: "ApplicationDeclined",
                data: emailData,
                cancellationToken: cancellationToken
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error sending applicant notification for ApplicationId={ApplicationId}",
                riskEvent.ApplicationId);
        }
    }
}

/// <summary>
/// Data structure for compliance alert email template
/// </summary>
public class ComplianceAlertEmailData
{
    public Guid ApplicationId { get; set; }
    public string ApplicantName { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public List<string> RiskFactors { get; set; } = new();
    public DateTime AssessedAt { get; set; }
    public string ReviewUrl { get; set; } = string.Empty;
    public List<DocumentSummary> Documents { get; set; } = new();
    public string? ComplianceNotes { get; set; }
}

public class DocumentSummary
{
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Configuration options for compliance alerts
/// </summary>
public class ComplianceAlertOptions
{
    public string ComplianceTeamEmail { get; set; } = "ddhrp@mukuru.com";
    public string ApplicationBaseUrl { get; set; } = "https://onboarding.mukuru.com";
    public string? WebhookUrl { get; set; }
    public bool EnableWebhooks { get; set; } = true;
}

// Domain events from Risk Service
public record RiskAssessedEvent
{
    public Guid ApplicationId { get; init; }
    public string ApplicantName { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public RiskLevel RiskLevel { get; init; }
    public decimal RiskScore { get; init; }
    public List<string> RiskFactors { get; init; } = new();
    public bool IsDeclined { get; init; }
    public string? DeclineReason { get; init; }
    public string? ApplicantEmail { get; init; }
    public DateTime AssessedAt { get; init; }
    public List<DocumentSummary> DocumentSummary { get; init; } = new();
    public string? ComplianceNotes { get; init; }
}

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

