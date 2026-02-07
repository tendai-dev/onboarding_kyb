using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Infrastructure.Utilities;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Partner utilities controller
/// Provides endpoints for partner-related operations
/// </summary>
[ApiController]
[Route("api/v1/partner")]
public class PartnerController : ControllerBase
{
    private readonly ILogger<PartnerController> _logger;
    private readonly IEmailSender _emailSender;

    public PartnerController(
        ILogger<PartnerController> logger,
        IEmailSender emailSender)
    {
        _logger = logger;
        _emailSender = emailSender;
    }

    /// <summary>
    /// Get PartnerId for the authenticated user
    /// This is the single source of truth for PartnerId generation
    /// Frontend should use this instead of generating MD5 locally
    /// SECURITY: Requires authentication
    /// </summary>
    [HttpGet("id")]
    [Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Always require authentication
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetPartnerId()
    {
        // Get authenticated user's email from headers (set by DevelopmentAuthMiddleware or JWT)
        // SECURITY FIX: Sanitize header value to prevent header injection
        var userEmail = SanitizeHeaderValue(Request.Headers["X-User-Email"].FirstOrDefault());
        
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            _logger.LogWarning("GetPartnerId request rejected - user email not found");
            return Unauthorized(new { error = "User email not found in authentication headers" });
        }

        // Generate PartnerId from authenticated user's email (single source of truth)
        var partnerId = PartnerIdGenerator.GenerateFromEmail(userEmail);
        
        // SECURITY FIX: Mask PII in logs
        _logger.LogInformation("Generated PartnerId for user: {Email} -> {PartnerId}", 
            Infrastructure.Utilities.LoggingExtensions.MaskEmail(userEmail), 
            Infrastructure.Utilities.LoggingExtensions.MaskGuid(partnerId));
        
        return Ok(new
        {
            email = userEmail,
            partnerId = partnerId.ToString(),
            partnerIdGuid = partnerId
        });
    }

    /// <summary>
    /// Validate that a PartnerId matches the authenticated user
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult ValidatePartnerId([FromBody] ValidatePartnerIdRequest request)
    {
        // SECURITY FIX: Sanitize header value to prevent header injection
        var userEmail = SanitizeHeaderValue(Request.Headers["X-User-Email"].FirstOrDefault());
        
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            return Unauthorized(new { error = "User email not found" });
        }

        if (!Guid.TryParse(request.PartnerId, out var partnerIdGuid))
        {
            return BadRequest(new { error = "Invalid PartnerId format" });
        }

        var isValid = PartnerIdGenerator.Validate(userEmail, partnerIdGuid);
        
        return Ok(new
        {
            email = userEmail,
            partnerId = request.PartnerId,
            isValid = isValid
        });
    }

    /// <summary>
    /// Send a test email via SendGrid
    /// This endpoint allows testing the SendGrid integration
    /// </summary>
    [HttpPost("test-email")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.To))
        {
            return BadRequest(new { error = "Email address (to) is required" });
        }

        try
        {
            var subject = request.Subject ?? "Test Email from Mukuru Onboarding";
            var content = request.Content ?? $@"
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Test Email</title>
</head>
<body style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"">
    <div style=""background-color: #FF6B35; padding: 20px; text-align: center;"">
        <h1 style=""color: white; margin: 0;"">Test Email</h1>
    </div>
    
    <div style=""background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;"">
        <p>This is a test email from the Mukuru Onboarding system.</p>
        
        <p><strong>Timestamp:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
        <p><strong>Recipient:</strong> {request.To}</p>
        
        <p>If you received this email, your SendGrid integration is working correctly!</p>
        
        <p>Best regards,<br>The Mukuru Onboarding Team</p>
    </div>
    
    <div style=""margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;"">
        <p>This is a test message. Please do not reply to this email.</p>
    </div>
</body>
</html>";

            await _emailSender.SendEmailAsync(request.To, subject, content, cancellationToken);

            _logger.LogInformation("Test email sent successfully to {To}", request.To);

            return Ok(new
            {
                success = true,
                message = "Test email sent successfully",
                to = request.To,
                subject = subject,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to {To}", request.To);
            return StatusCode(500, new
            {
                success = false,
                error = "Failed to send test email",
                message = ex.Message
            });
        }
    }

    /// <summary>
    /// SECURITY FIX: Sanitize header values to prevent header injection attacks
    /// </summary>
    private static string? SanitizeHeaderValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        
        // Remove newlines, carriage returns, and other control characters that could be used for header injection
        value = System.Text.RegularExpressions.Regex.Replace(value, @"[\r\n\x00-\x1F]", "");
        
        // Limit length to prevent overly long headers
        if (value.Length > 255)
        {
            value = value.Substring(0, 255);
        }
        
        // Remove potentially dangerous characters
        value = System.Text.RegularExpressions.Regex.Replace(value, @"[^\w\s\-_.@]", "");
        
        return value.Trim();
    }
}

public class ValidatePartnerIdRequest
{
    public string PartnerId { get; set; } = string.Empty;
}

public class SendTestEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Content { get; set; }
}

