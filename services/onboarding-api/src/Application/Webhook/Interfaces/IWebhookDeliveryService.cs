namespace OnboardingApi.Application.Webhook.Interfaces;

/// <summary>
/// Service responsible for delivering webhooks with HMAC signature and retry logic
/// </summary>
public interface IWebhookDeliveryService
{
    /// <summary>
    /// Deliver webhook with HMAC signature
    /// </summary>
    Task<WebhookDeliveryResult> DeliverWebhookAsync(
        WebhookPayload payload,
        string targetUrl,
        string signingSecret,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Verify HMAC signature (for testing/validation)
    /// </summary>
    bool VerifyHmacSignature(string payload, string signature, string secret);
}

public class WebhookPayload
{
    public string EventType { get; set; } = string.Empty;
    public object Data { get; set; } = new();
}

public class WebhookDeliveryResult
{
    public string DeliveryId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public int? StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
    public int AttemptCount { get; set; }
}

