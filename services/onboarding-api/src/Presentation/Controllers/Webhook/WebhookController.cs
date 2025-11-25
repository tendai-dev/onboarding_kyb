using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Webhook.Interfaces;

namespace OnboardingApi.Presentation.Controllers.Webhook;

[ApiController]
[Route("api/v1/webhooks")]
public class WebhookController : ControllerBase
{
    private readonly IWebhookDeliveryService _webhookDeliveryService;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IWebhookDeliveryService webhookDeliveryService,
        ILogger<WebhookController> logger)
    {
        _webhookDeliveryService = webhookDeliveryService;
        _logger = logger;
    }

    /// <summary>
    /// Deliver a webhook to a target URL
    /// </summary>
    [HttpPost("deliver")]
    [ProducesResponseType(typeof(WebhookDeliveryResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [AllowAnonymous]
    public async Task<IActionResult> DeliverWebhook([FromBody] DeliverWebhookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TargetUrl))
            return BadRequest(new { error = "TargetUrl is required" });

        if (string.IsNullOrWhiteSpace(request.SigningSecret))
            return BadRequest(new { error = "SigningSecret is required" });

        if (request.Payload == null)
            return BadRequest(new { error = "Payload is required" });

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
    /// </summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyWebhookResult), StatusCodes.Status200OK)]
    [AllowAnonymous]
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

