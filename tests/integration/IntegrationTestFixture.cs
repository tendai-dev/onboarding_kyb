using System;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace OnboardingPlatform.Tests.Integration;

/// <summary>
/// Test fixture providing HTTP clients for all services
/// Shared across all integration tests for performance
/// </summary>
public class IntegrationTestFixture : IDisposable
{
    // HTTP Clients for each service
    public HttpClient OnboardingApiClient { get; }
    public HttpClient DocumentClient { get; }
    public HttpClient RiskClient { get; }
    public HttpClient ChecklistClient { get; }
    public HttpClient EntityConfigClient { get; }
    public HttpClient NotificationClient { get; }
    public HttpClient AuditLogClient { get; }
    public HttpClient ProjectionsClient { get; }
    public HttpClient WorkQueueClient { get; }
    public HttpClient MessagingClient { get; }
    
    // Test user identities
    public Guid AdminUserId { get; }
    public Guid ApplicantUserId { get; }
    public string AdminToken { get; private set; } = string.Empty;
    public string ComplianceManagerToken { get; private set; } = string.Empty;
    public string ApplicantToken { get; private set; } = string.Empty;
    
    private readonly IConfiguration _configuration;
    
    public IntegrationTestFixture()
    {
        // Load configuration
        _configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.test.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
        
        // Initialize test user IDs
        AdminUserId = Guid.NewGuid();
        ApplicantUserId = Guid.NewGuid();
        
        // Get base URLs from configuration (or use defaults)
        var baseUrl = _configuration["TestEnvironment:BaseUrl"] ?? "http://localhost";
        
        // Initialize HTTP clients for each service
        OnboardingApiClient = CreateHttpClient($"{baseUrl}:8080", "onboarding-api");
        DocumentClient = CreateHttpClient($"{baseUrl}:8081", "document-service");
        RiskClient = CreateHttpClient($"{baseUrl}:8082", "risk-service");
        ChecklistClient = CreateHttpClient($"{baseUrl}:8083", "checklist-service");
        EntityConfigClient = CreateHttpClient($"{baseUrl}:8084", "entity-configuration-service");
        NotificationClient = CreateHttpClient($"{baseUrl}:8085", "notification-service");
        AuditLogClient = CreateHttpClient($"{baseUrl}:8086", "audit-log-service");
        ProjectionsClient = CreateHttpClient($"{baseUrl}:8087", "projections-api");
        WorkQueueClient = CreateHttpClient($"{baseUrl}:8088", "work-queue-service");
        MessagingClient = CreateHttpClient($"{baseUrl}:8089", "messaging-service");
        
        // Generate test tokens
        GenerateTestTokens();
    }
    
    private HttpClient CreateHttpClient(string baseAddress, string serviceName)
    {
        var client = new HttpClient
        {
            BaseAddress = new Uri(baseAddress),
            Timeout = TimeSpan.FromSeconds(30)
        };
        
        // Add default headers
        client.DefaultRequestHeaders.Add("X-Request-Id", Guid.NewGuid().ToString());
        client.DefaultRequestHeaders.Add("User-Agent", "IntegrationTests/1.0");
        
        // Add authentication token (will be set later)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", AdminToken);
        
        return client;
    }
    
    private void GenerateTestTokens()
    {
        // In real tests, these would be obtained from Keycloak/Azure AD
        // For integration tests, use test tokens or mock authentication
        
        var testTokenService = new TestTokenService();
        
        // Generate admin token with roles
        AdminToken = testTokenService.GenerateToken(
            userId: AdminUserId.ToString(),
            name: "Test Admin",
            email: "admin@test.com",
            roles: new[] { "Admin", "Reviewer" }
        );
        
        // Generate compliance manager token
        ComplianceManagerToken = testTokenService.GenerateToken(
            userId: Guid.NewGuid().ToString(),
            name: "Test Compliance Manager",
            email: "compliance@test.com",
            roles: new[] { "ComplianceManager", "Admin" }
        );
        
        // Generate applicant token
        ApplicantToken = testTokenService.GenerateToken(
            userId: ApplicantUserId.ToString(),
            name: "Test Applicant",
            email: "applicant@test.com",
            roles: new[] { "Applicant" }
        );
        
        // Set default token for all clients
        SetAuthTokenForAllClients(AdminToken);
    }
    
    public void SetAuthTokenForAllClients(string token)
    {
        var clients = new[]
        {
            OnboardingApiClient, DocumentClient, RiskClient, ChecklistClient,
            EntityConfigClient, NotificationClient, AuditLogClient, ProjectionsClient,
            WorkQueueClient, MessagingClient
        };
        
        foreach (var client in clients)
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
    }
    
    public void Dispose()
    {
        OnboardingApiClient?.Dispose();
        DocumentClient?.Dispose();
        RiskClient?.Dispose();
        ChecklistClient?.Dispose();
        EntityConfigClient?.Dispose();
        NotificationClient?.Dispose();
        AuditLogClient?.Dispose();
        ProjectionsClient?.Dispose();
        WorkQueueClient?.Dispose();
        MessagingClient?.Dispose();
    }
}

/// <summary>
/// Helper service to generate JWT tokens for testing
/// </summary>
public class TestTokenService
{
    public string GenerateToken(string userId, string name, string email, string[] roles)
    {
        // In production, this would generate a real JWT
        // For integration tests, you can use a test token or mock authentication
        
        // Simple base64 encoded token for testing
        var payload = new
        {
            sub = userId,
            name = name,
            email = email,
            role = roles,
            exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()
        };
        
        var json = System.Text.Json.JsonSerializer.Serialize(payload);
        var base64 = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(json));
        
        return $"test.{base64}.signature";
    }
}

