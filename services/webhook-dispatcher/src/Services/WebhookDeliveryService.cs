using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Polly;
using Polly.Retry;

namespace WebhookDispatcher.Services;

/// <summary>
/// Service responsible for delivering webhooks with HMAC signature and retry logic
/// </summary>
public class WebhookDeliveryService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WebhookDeliveryService> _logger;
    private readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;
    private int _currentAttemptCount;

    public WebhookDeliveryService(
        HttpClient httpClient,
        ILogger<WebhookDeliveryService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        // Retry schedule: immediate, 1m, 5m, 30m, 2h, 6h, 24h
        var retryDelays = new[]
        {
            TimeSpan.Zero,
            TimeSpan.FromMinutes(1),
            TimeSpan.FromMinutes(5),
            TimeSpan.FromMinutes(30),
            TimeSpan.FromHours(2),
            TimeSpan.FromHours(6),
            TimeSpan.FromHours(24)
        };

        _retryPolicy = Policy
            .HandleResult<HttpResponseMessage>(r =>
                !r.IsSuccessStatusCode &&
                r.StatusCode != System.Net.HttpStatusCode.BadRequest &&
                r.StatusCode != System.Net.HttpStatusCode.Unauthorized &&
                r.StatusCode != System.Net.HttpStatusCode.Forbidden)
            .Or<HttpRequestException>()
            .Or<TaskCanceledException>()
            .WaitAndRetryAsync(
                retryDelays,
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    _currentAttemptCount = retryCount + 1;
                    _logger.LogWarning(
                        "Webhook delivery retry {RetryCount} after {Delay}. Status: {Status}",
                        retryCount,
                        timespan,
                        outcome.Result?.StatusCode.ToString() ?? "Exception");
                });
    }

    /// <summary>
    /// Deliver webhook with HMAC signature
    /// </summary>
    public async Task<WebhookDeliveryResult> DeliverWebhookAsync(
        WebhookPayload payload,
        string targetUrl,
        string signingSecret,
        CancellationToken cancellationToken = default)
    {
        var deliveryId = Guid.NewGuid().ToString();
        var timestamp = DateTimeOffset.UtcNow;

        var body = JsonSerializer.Serialize(payload.Data);
        var signature = GenerateHmacSignature(body, signingSecret);

        var request = new HttpRequestMessage(HttpMethod.Post, targetUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        // Add webhook headers
        request.Headers.Add("X-Webhook-Signature", $"sha256={signature}");
        request.Headers.Add("X-Webhook-Delivery-Id", deliveryId);
        request.Headers.Add("X-Webhook-Event-Type", payload.EventType);
        request.Headers.Add("X-Webhook-Timestamp", timestamp.ToUnixTimeSeconds().ToString());
        request.Headers.Add("User-Agent", "OnboardingPlatform-Webhooks/1.0");

        try
        {
            _currentAttemptCount = 1; // Reset attempt counter
            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                _logger.LogInformation(
                    "Delivering webhook {DeliveryId} to {Url}, event {EventType} (attempt {Attempt})",
                    deliveryId,
                    targetUrl,
                    payload.EventType,
                    _currentAttemptCount);

                return await _httpClient.SendAsync(request, cancellationToken);
            });

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation(
                    "Webhook {DeliveryId} delivered successfully. Status: {Status}",
                    deliveryId,
                    response.StatusCode);

                return new WebhookDeliveryResult
                {
                    DeliveryId = deliveryId,
                    Success = true,
                    StatusCode = (int)response.StatusCode,
                    AttemptCount = _currentAttemptCount
                };
            }
            else
            {
                _logger.LogError(
                    "Webhook {DeliveryId} delivery failed. Status: {Status}",
                    deliveryId,
                    response.StatusCode);

                return new WebhookDeliveryResult
                {
                    DeliveryId = deliveryId,
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = $"HTTP {response.StatusCode}",
                    AttemptCount = _currentAttemptCount
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Webhook {DeliveryId} delivery exception: {Message}",
                deliveryId,
                ex.Message);

            return new WebhookDeliveryResult
            {
                DeliveryId = deliveryId,
                Success = false,
                ErrorMessage = ex.Message,
                AttemptCount = 1
            };
        }
    }

    /// <summary>
    /// Generate HMAC-SHA256 signature
    /// </summary>
    private string GenerateHmacSignature(string payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(payloadBytes);
        return Convert.ToBase64String(hash);
    }

    /// <summary>
    /// Verify HMAC signature (for testing/validation)
    /// </summary>
    public static bool VerifyHmacSignature(string payload, string signature, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(keyBytes);
        var expectedHash = hmac.ComputeHash(payloadBytes);
        var expectedSignature = $"sha256={Convert.ToBase64String(expectedHash)}";

        // Constant-time comparison to prevent timing attacks
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedSignature),
            Encoding.UTF8.GetBytes(signature));
    }
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

