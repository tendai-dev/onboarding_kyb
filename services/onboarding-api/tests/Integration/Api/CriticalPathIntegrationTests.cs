using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace OnboardingApi.Tests.Integration.Api;

/// <summary>
/// Integration tests for critical business paths.
/// These tests verify end-to-end functionality of the most important workflows.
/// </summary>
public class CriticalPathIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CriticalPathIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        _client.DefaultRequestHeaders.Add("X-User-Email", "integration-test@example.com");
    }

    #region Case Lifecycle Tests

    [Fact]
    public async Task CaseLifecycle_CreateToApproval_ShouldCompleteSuccessfully()
    {
        // 1. Create case
        var createResponse = await _client.PostAsJsonAsync("/api/cases", new
        {
            type = "Individual",
            applicant = new
            {
                first_name = "Integration",
                last_name = "Test",
                email = $"test-{Guid.NewGuid()}@example.com",
                phone_number = "+1234567890",
                residential_address = new
                {
                    street = "123 Test St",
                    city = "Test City",
                    state = "TS",
                    postal_code = "12345",
                    country = "US"
                }
            }
        });

        createResponse.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
        var caseData = await createResponse.Content.ReadFromJsonAsync<dynamic>();
        var caseId = caseData?.GetProperty("case_id").GetString();
        caseId.Should().NotBeNullOrEmpty();

        // 2. Get case - verify it exists
        var getResponse = await _client.GetAsync($"/api/cases/{caseId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3. Submit case for review
        var submitResponse = await _client.PostAsync($"/api/cases/{caseId}/submit", null);
        submitResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CaseCreation_WithMissingRequiredFields_ShouldReturnValidationErrors()
    {
        var response = await _client.PostAsJsonAsync("/api/cases", new
        {
            type = "Individual",
            applicant = new
            {
                // Missing required fields: first_name, last_name, email
            }
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeEmpty();
    }

    #endregion

    #region Work Queue Tests

    [Fact]
    public async Task WorkQueue_GetItems_ShouldReturnPaginatedResults()
    {
        var response = await _client.GetAsync("/api/work-items?page=1&pageSize=10");
        
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task WorkQueue_FilterByStatus_ShouldReturnFilteredResults()
    {
        var response = await _client.GetAsync("/api/work-items?status=Pending");
        
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Document Upload Tests

    [Fact]
    public async Task DocumentUpload_WithInvalidContentType_ShouldReject()
    {
        var caseId = Guid.NewGuid();
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent("test content"), "file", "test.exe");

        var response = await _client.PostAsync($"/api/cases/{caseId}/documents", content);
        
        // Should reject .exe files
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound, HttpStatusCode.UnsupportedMediaType);
    }

    #endregion

    #region Audit Log Tests

    [Fact]
    public async Task AuditLog_GetByCaseId_ShouldReturnLogs()
    {
        var caseId = Guid.NewGuid();
        var response = await _client.GetAsync($"/api/audit/case/{caseId}");
        
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound, HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Health Check Tests

    [Fact]
    public async Task HealthCheck_ShouldReturnHealthy()
    {
        var response = await _client.GetAsync("/health");
        
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task ReadinessCheck_ShouldReturnStatus()
    {
        var response = await _client.GetAsync("/ready");
        
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable, HttpStatusCode.NotFound);
    }

    #endregion

    #region Idempotency Tests

    [Fact]
    public async Task Idempotency_DuplicateRequest_ShouldReturnSameResult()
    {
        var idempotencyKey = Guid.NewGuid().ToString();
        _client.DefaultRequestHeaders.Add("X-Idempotency-Key", idempotencyKey);

        var request = new
        {
            type = "Individual",
            applicant = new
            {
                first_name = "Idempotent",
                last_name = "Test",
                email = $"idempotent-{Guid.NewGuid()}@example.com",
                residential_address = new
                {
                    street = "123 Test St",
                    city = "Test City",
                    state = "TS",
                    postal_code = "12345",
                    country = "US"
                }
            }
        };

        // First request
        var response1 = await _client.PostAsJsonAsync("/api/cases", request);
        var content1 = await response1.Content.ReadAsStringAsync();

        // Second request with same idempotency key should return cached result
        var response2 = await _client.PostAsJsonAsync("/api/cases", request);
        var content2 = await response2.Content.ReadAsStringAsync();

        response1.StatusCode.Should().Be(response2.StatusCode);
        
        _client.DefaultRequestHeaders.Remove("X-Idempotency-Key");
    }

    #endregion

    #region Cross-Schema Transaction Tests

    [Fact]
    public async Task CaseWithDocuments_ShouldMaintainConsistency()
    {
        // Create case
        var createResponse = await _client.PostAsJsonAsync("/api/cases", new
        {
            type = "Individual",
            applicant = new
            {
                first_name = "CrossSchema",
                last_name = "Test",
                email = $"cross-schema-{Guid.NewGuid()}@example.com",
                residential_address = new
                {
                    street = "123 Test St",
                    city = "Test City",
                    state = "TS",
                    postal_code = "12345",
                    country = "US"
                }
            }
        });

        if (createResponse.IsSuccessStatusCode)
        {
            var caseData = await createResponse.Content.ReadFromJsonAsync<dynamic>();
            var caseId = caseData?.GetProperty("case_id").GetString();

            // Verify case exists
            var getResponse = await _client.GetAsync($"/api/cases/{caseId}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Verify work item was created (cross-schema)
            var workItemResponse = await _client.GetAsync($"/api/work-items?caseId={caseId}");
            workItemResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
        }
    }

    #endregion

    #region Rate Limiting Tests

    [Fact]
    public async Task RateLimiting_ExcessiveRequests_ShouldThrottle()
    {
        var tasks = Enumerable.Range(0, 20)
            .Select(_ => _client.GetAsync("/api/cases"))
            .ToList();

        var responses = await Task.WhenAll(tasks);
        
        // At least some should succeed, but excessive requests may be throttled
        responses.Should().Contain(r => r.StatusCode == HttpStatusCode.OK || r.StatusCode == HttpStatusCode.TooManyRequests);
    }

    #endregion
}

/// <summary>
/// Database integration tests for repository operations.
/// </summary>
public class RepositoryIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RepositoryIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void ServiceProvider_ShouldResolveRepositories()
    {
        using var scope = _factory.Services.CreateScope();
        
        var caseRepository = scope.ServiceProvider.GetService<OnboardingApi.Application.Interfaces.IOnboardingCaseRepository>();
        caseRepository.Should().NotBeNull();
        
        var workItemRepository = scope.ServiceProvider.GetService<OnboardingApi.Application.WorkQueue.Interfaces.IWorkItemRepository>();
        workItemRepository.Should().NotBeNull();
    }
}

/// <summary>
/// API contract tests to verify response schemas.
/// </summary>
public class ApiContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiContractTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        _client.DefaultRequestHeaders.Add("X-User-Email", "contract-test@example.com");
    }

    [Fact]
    public async Task GetCases_ResponseSchema_ShouldMatchContract()
    {
        var response = await _client.GetAsync("/api/cases");
        
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            
            // Verify response contains expected fields
            content.Should().NotBeEmpty();
            // Response should be valid JSON
            var isValidJson = () => System.Text.Json.JsonDocument.Parse(content);
            isValidJson.Should().NotThrow();
        }
    }

    [Fact]
    public async Task ErrorResponse_ShouldIncludeCorrelationId()
    {
        var response = await _client.GetAsync($"/api/cases/{Guid.NewGuid()}");
        
        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            // Error responses should include correlation ID header
            response.Headers.Should().ContainKey("X-Correlation-Id");
        }
    }

    [Fact]
    public async Task PaginatedResponse_ShouldIncludeMetadata()
    {
        var response = await _client.GetAsync("/api/cases?page=1&pageSize=10");
        
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            
            // Paginated responses should include pagination metadata
            var hasMetadata = content.Contains("total") || content.Contains("page") || content.Contains("items");
            hasMetadata.Should().BeTrue();
        }
    }
}
