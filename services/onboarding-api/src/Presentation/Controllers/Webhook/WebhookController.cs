using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Webhook.Interfaces;
using Microsoft.Extensions.Configuration;

namespace OnboardingApi.Presentation.Controllers.Webhook;

[ApiController]
[Route("api/v1/webhooks")]
[Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Require authentication
public class WebhookController : ControllerBase
{
    private readonly IWebhookDeliveryService _webhookDeliveryService;
    private readonly ILogger<WebhookController> _logger;
    private readonly IConfiguration _configuration;

    public WebhookController(
        IWebhookDeliveryService webhookDeliveryService,
        ILogger<WebhookController> logger,
        IConfiguration configuration)
    {
        _webhookDeliveryService = webhookDeliveryService;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Deliver a webhook to a target URL
    /// SECURITY: Validates URL to prevent SSRF attacks
    /// </summary>
    [HttpPost("deliver")]
    [ProducesResponseType(typeof(WebhookDeliveryResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeliverWebhook([FromBody] DeliverWebhookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TargetUrl))
            return BadRequest(new { error = "TargetUrl is required" });

        if (string.IsNullOrWhiteSpace(request.SigningSecret))
            return BadRequest(new { error = "SigningSecret is required" });

        if (request.Payload == null)
            return BadRequest(new { error = "Payload is required" });

        // SECURITY FIX: Validate URL to prevent SSRF attacks
        if (!Uri.TryCreate(request.TargetUrl, UriKind.Absolute, out var uri))
            return BadRequest(new { error = "Invalid URL format" });

        // SECURITY FIX: Prevent SSRF - block internal/localhost URLs
        if (uri.IsLoopback || 
            uri.Host == "localhost" || 
            uri.Host == "127.0.0.1" || 
            uri.Host == "::1" ||
            uri.Host.StartsWith("192.168.") ||
            uri.Host.StartsWith("10.") ||
            uri.Host.StartsWith("172.16.") ||
            uri.Host.StartsWith("172.17.") ||
            uri.Host.StartsWith("172.18.") ||
            uri.Host.StartsWith("172.19.") ||
            uri.Host.StartsWith("172.20.") ||
            uri.Host.StartsWith("172.21.") ||
            uri.Host.StartsWith("172.22.") ||
            uri.Host.StartsWith("172.23.") ||
            uri.Host.StartsWith("172.24.") ||
            uri.Host.StartsWith("172.25.") ||
            uri.Host.StartsWith("172.26.") ||
            uri.Host.StartsWith("172.27.") ||
            uri.Host.StartsWith("172.28.") ||
            uri.Host.StartsWith("172.29.") ||
            uri.Host.StartsWith("172.30.") ||
            uri.Host.StartsWith("172.31."))
        {
            _logger.LogWarning("SSRF attempt blocked: {Url}", request.TargetUrl);
            return BadRequest(new { error = "Internal URLs are not allowed" });
        }

        // SECURITY FIX: Only allow HTTPS in production
        var isDevelopment = _configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development";
        if (!isDevelopment && uri.Scheme != "https")
        {
            return BadRequest(new { error = "Only HTTPS URLs are allowed in production" });
        }

        // SECURITY FIX: Check against whitelist if configured
        var allowedDomains = _configuration.GetSection("Webhooks:AllowedDomains").Get<string[]>();
        if (allowedDomains != null && allowedDomains.Length > 0 && !allowedDomains.Contains(uri.Host))
        {
            _logger.LogWarning("Webhook delivery to non-whitelisted domain blocked: {Domain}", uri.Host);
            return BadRequest(new { error = "Target domain is not in the allowed list" });
        }

        try
        {
            var result = await _webhookDeliveryService.DeliverWebhookAsync(
                request.Payload,
                request.TargetUrl,
                request.SigningSecret);

            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deliver webhook to {Url}", request.TargetUrl);
            return StatusCode(500, new { error = "Failed to deliver webhook", message = ex.Message });
        }
    }

    /// <summary>
    /// Verify webhook signature
    /// SECURITY: Requires authentication to prevent abuse
    /// </summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyWebhookResult), StatusCodes.Status200OK)]
    [Microsoft.AspNetCore.Authorization.Authorize] // SECURITY FIX: Require authentication
    public IActionResult VerifyWebhook([FromBody] VerifyWebhookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Payload) || 
            string.IsNullOrWhiteSpace(request.Signature) || 
            string.IsNullOrWhiteSpace(request.Secret))
        {
            return BadRequest(new { error = "Payload, Signature, and Secret are required" });
        }

        var isValid = _webhookDeliveryService.VerifyHmacSignature(
            request.Payload,
            request.Signature,
            request.Secret);

        return Ok(new VerifyWebhookResult { IsValid = isValid });
    }
}

public class DeliverWebhookRequest
{
    public WebhookPayload Payload { get; set; } = new();
    public string TargetUrl { get; set; } = string.Empty;
    public string SigningSecret { get; set; } = string.Empty;
}

public class VerifyWebhookRequest
{
    public string Payload { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
}

public class VerifyWebhookResult
{
    public bool IsValid { get; set; }
}

