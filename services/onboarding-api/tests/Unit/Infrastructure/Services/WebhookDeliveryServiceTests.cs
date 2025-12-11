using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Webhook.Interfaces;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class WebhookDeliveryServiceTests
{
    private readonly MockLogger<WebhookDeliveryService> _logger;
    private readonly MockHttpClientFactory _httpClientFactory;

    public WebhookDeliveryServiceTests()
    {
        _logger = new MockLogger<WebhookDeliveryService>();
        _httpClientFactory = new MockHttpClientFactory();
    }

    [Fact]
    public async Task DeliverWebhookAsync_ShouldReturnSuccess_WhenRequestSucceeds()
    {
        // Arrange
        var payload = new WebhookPayload
        {
            EventType = "case.created",
            Data = new { CaseId = "123", Status = "pending" }
        };
        var targetUrl = "https://example.com/webhook";
        var signingSecret = "test-secret";

        var response = new HttpResponseMessage(HttpStatusCode.OK);
        _httpClientFactory.SetupResponse(targetUrl, response);

        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Act
        var result = await service.DeliverWebhookAsync(payload, targetUrl, signingSecret);

        // Assert
        Assert.True(result.Success);
        Assert.Equal((int)HttpStatusCode.OK, result.StatusCode);
        Assert.NotNull(result.DeliveryId);
        Assert.Equal(1, result.AttemptCount);
    }

    [Fact]
    public async Task DeliverWebhookAsync_ShouldIncludeHmacSignature_WhenRequestSucceeds()
    {
        // Arrange
        var payload = new WebhookPayload
        {
            EventType = "case.created",
            Data = new { CaseId = "123" }
        };
        var targetUrl = "https://example.com/webhook";
        var signingSecret = "test-secret";

        var response = new HttpResponseMessage(HttpStatusCode.OK);
        _httpClientFactory.SetupResponse(targetUrl, response);

        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Act
        await service.DeliverWebhookAsync(payload, targetUrl, signingSecret);

        // Assert
        var capturedRequest = _httpClientFactory.LastRequest;
        Assert.NotNull(capturedRequest);
        Assert.True(capturedRequest.Headers.Contains("X-Webhook-Signature"));
        Assert.True(capturedRequest.Headers.Contains("X-Webhook-Delivery-Id"));
        Assert.True(capturedRequest.Headers.Contains("X-Webhook-Event-Type"));
        Assert.True(capturedRequest.Headers.Contains("X-Webhook-Timestamp"));
    }

    [Fact]
    public async Task DeliverWebhookAsync_ShouldReturnFailure_WhenRequestFails()
    {
        // Arrange
        var payload = new WebhookPayload
        {
            EventType = "case.created",
            Data = new { CaseId = "123" }
        };
        var targetUrl = "https://example.com/webhook";
        var signingSecret = "test-secret";

        // Use BadRequest which won't be retried
        var response = new HttpResponseMessage(HttpStatusCode.BadRequest);
        _httpClientFactory.SetupResponse(targetUrl, response);

        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Act
        var result = await service.DeliverWebhookAsync(payload, targetUrl, signingSecret);

        // Assert
        Assert.False(result.Success);
        Assert.Equal((int)HttpStatusCode.BadRequest, result.StatusCode);
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public async Task DeliverWebhookAsync_ShouldReturnFailure_WhenExceptionOccurs()
    {
        // Arrange
        var payload = new WebhookPayload
        {
            EventType = "case.created",
            Data = new { CaseId = "123" }
        };
        var targetUrl = "https://example.com/webhook";
        var signingSecret = "test-secret";

        _httpClientFactory.SetupException(targetUrl, new HttpRequestException("Connection failed"));

        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Act
        var result = await service.DeliverWebhookAsync(payload, targetUrl, signingSecret);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);
        // The exception message might be wrapped, so just check that error message exists
        Assert.False(string.IsNullOrEmpty(result.ErrorMessage));
    }

    [Fact]
    public void VerifyHmacSignature_ShouldReturnTrue_WhenSignatureIsValid()
    {
        // Arrange
        var testPayload = "test payload";
        var testSecret = "secret";
        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Generate expected signature manually
        var keyBytes = Encoding.UTF8.GetBytes(testSecret);
        var payloadBytes = Encoding.UTF8.GetBytes(testPayload);
        using var hmac = new System.Security.Cryptography.HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(payloadBytes);
        var expectedSignature = $"sha256={Convert.ToBase64String(hash)}";

        // Act
        var verified = service.VerifyHmacSignature(testPayload, expectedSignature, testSecret);

        // Assert
        Assert.True(verified);
    }

    [Fact]
    public void VerifyHmacSignature_ShouldReturnFalse_WhenSignatureIsInvalid()
    {
        // Arrange
        var payload = "test payload";
        var secret = "secret";
        var invalidSignature = "sha256=invalid";
        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Act
        var verified = service.VerifyHmacSignature(payload, invalidSignature, secret);

        // Assert
        Assert.False(verified);
    }

    [Fact]
    public async Task DeliverWebhookAsync_ShouldSetCorrectContentType()
    {
        // Arrange
        var payload = new WebhookPayload
        {
            EventType = "case.created",
            Data = new { CaseId = "123" }
        };
        var targetUrl = "https://example.com/webhook";
        var signingSecret = "test-secret";

        var response = new HttpResponseMessage(HttpStatusCode.OK);
        _httpClientFactory.SetupResponse(targetUrl, response);

        var service = new WebhookDeliveryService(_httpClientFactory.CreateClient(), _logger);

        // Act
        await service.DeliverWebhookAsync(payload, targetUrl, signingSecret);

        // Assert
        var capturedRequest = _httpClientFactory.LastRequest;
        Assert.NotNull(capturedRequest);
        Assert.NotNull(capturedRequest.Content);
        Assert.Equal("application/json", capturedRequest.Content.Headers.ContentType?.MediaType);
        Assert.Equal("utf-8", capturedRequest.Content.Headers.ContentType?.CharSet);
    }
}

public class MockHttpClientFactory
{
    private readonly Dictionary<string, Func<HttpRequestMessage, Task<HttpResponseMessage>>> _responses = new();
    private readonly Dictionary<string, Exception> _exceptions = new();
    private HttpRequestMessage? _lastRequest;

    public HttpRequestMessage? LastRequest => _lastRequest;

    public void SetupResponse(string url, HttpResponseMessage response, Action<HttpRequestMessage>? captureRequest = null)
    {
        _responses[url] = async request =>
        {
            _lastRequest = request;
            captureRequest?.Invoke(request);
            await Task.Delay(10); // Simulate network delay
            return response;
        };
    }

    public void SetupException(string url, Exception exception)
    {
        _exceptions[url] = exception;
    }

    public HttpClient CreateClient()
    {
        var handler = new MockHttpMessageHandler(_responses, _exceptions, this);
        return new HttpClient(handler);
    }
}

public class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly Dictionary<string, Func<HttpRequestMessage, Task<HttpResponseMessage>>> _responses;
    private readonly Dictionary<string, Exception> _exceptions;
    private readonly MockHttpClientFactory _factory;

    public MockHttpMessageHandler(
        Dictionary<string, Func<HttpRequestMessage, Task<HttpResponseMessage>>> responses,
        Dictionary<string, Exception> exceptions,
        MockHttpClientFactory factory)
    {
        _responses = responses;
        _exceptions = exceptions;
        _factory = factory;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var url = request.RequestUri?.ToString() ?? "";
        
        if (_exceptions.TryGetValue(url, out var exception))
        {
            throw exception;
        }

        if (_responses.TryGetValue(url, out var responseFunc))
        {
            return responseFunc(request);
        }

        // Default response
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
    }
}

