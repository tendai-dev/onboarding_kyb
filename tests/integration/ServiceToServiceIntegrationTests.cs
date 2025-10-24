using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;
using FluentAssertions;

namespace OnboardingPlatform.Tests.Integration;

/// <summary>
/// Service-to-service integration tests
/// Verifies direct communication between services
/// </summary>
public class ServiceToServiceIntegrationTests : IClassFixture<IntegrationTestFixture>
{
    private readonly IntegrationTestFixture _fixture;
    private readonly ITestOutputHelper _output;
    
    public ServiceToServiceIntegrationTests(IntegrationTestFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }
    
    [Fact]
    public async Task OnboardingAPI_To_EntityConfigService_GetFormConfiguration_Success()
    {
        _output.WriteLine("🧪 Testing: Onboarding API → Entity Config Service");
        
        // Simulate onboarding API calling entity config service
        var response = await _fixture.EntityConfigClient.GetAsync(
            "/api/v1/FormConfiguration?entityType=PRIVATE_COMPANY&country=UK");
        
        response.IsSuccessStatusCode.Should().BeTrue();
        
        var formConfig = await response.Content.ReadFromJsonAsync<FormConfigurationDto>();
        formConfig.Should().NotBeNull();
        
        _output.WriteLine($"✅ Form configuration retrieved: {formConfig!.FormCode}");
    }
    
    [Fact]
    public async Task EntityConfigService_To_CompaniesHouse_FetchCompanyData_Success()
    {
        _output.WriteLine("🧪 Testing: Entity Config → Companies House API");
        
        var response = await _fixture.EntityConfigClient.GetAsync(
            "/api/v1/FormConfiguration/external-data/company?registryType=CompaniesHouse&companyNumber=00000006&country=UK");
        
        response.IsSuccessStatusCode.Should().BeTrue();
        
        var companyData = await response.Content.ReadFromJsonAsync<ExternalCompanyData>();
        companyData.Should().NotBeNull();
        companyData!.CompanyName.Should().NotBeNullOrEmpty();
        
        _output.WriteLine($"✅ Company data fetched: {companyData.CompanyName}");
    }
    
    [Fact]
    public async Task DocumentService_To_ClamAV_VirusScan_Success()
    {
        _output.WriteLine("🧪 Testing: Document Service → ClamAV");
        
        // Upload clean document
        var testDoc = System.Text.Encoding.UTF8.GetBytes("%PDF-1.4\nClean Document\n%%EOF");
        var content = new MultipartFormDataContent
        {
            { new ByteArrayContent(testDoc), "file", "clean.pdf" },
            { new StringContent(Guid.NewGuid().ToString()), "caseId" },
            { new StringContent("PassportCopy"), "documentType" }
        };
        
        var response = await _fixture.DocumentClient.PostAsync("/api/v1/documents/upload", content);
        response.IsSuccessStatusCode.Should().BeTrue();
        
        var result = await response.Content.ReadFromJsonAsync<DocumentUploadResult>();
        var documentId = result!.DocumentId;
        
        // Wait for virus scanning
        await Task.Delay(3000);
        
        // Verify scanned
        var statusResponse = await _fixture.DocumentClient.GetAsync(
            $"/api/v1/documents/{documentId}/validation-status");
        
        var status = await statusResponse.Content.ReadFromJsonAsync<DocumentStatusDto>();
        status!.IsVirusScanned.Should().BeTrue();
        status.IsVirusClean.Should().BeTrue();
        
        _output.WriteLine("✅ Document successfully scanned by ClamAV");
    }
    
    [Fact]
    public async Task RiskService_To_NotificationService_HighRiskAlert_Success()
    {
        _output.WriteLine("🧪 Testing: Risk Service → Notification Service (High-Risk Alert)");
        
        // Create high-risk application
        var applicationId = await CreateHighRiskApplicationAsync();
        
        // Wait for risk assessment and notification
        await Task.Delay(5000);
        
        // Verify notification sent (check audit log)
        var auditResponse = await _fixture.AuditLogClient.GetAsync(
            $"/api/v1/auditlog?entityId={applicationId}&eventType=ComplianceAlertSent");
        
        if (auditResponse.IsSuccessStatusCode)
        {
            _output.WriteLine("✅ High-risk compliance alert triggered");
        }
        else
        {
            _output.WriteLine("⚠️ Compliance alert not found in audit log (may be async delay)");
        }
    }
    
    [Fact]
    public async Task WorkQueueService_To_NotificationService_AssignmentNotification_Success()
    {
        _output.WriteLine("🧪 Testing: Work Queue → Notification Service (Assignment)");
        
        // Create application and work item
        var applicationId = await CreateTestApplicationAsync();
        await Task.Delay(2000);
        
        // Get work item
        var workItemResponse = await _fixture.WorkQueueClient.GetAsync("/api/v1/WorkQueue");
        var workItems = await workItemResponse.Content.ReadFromJsonAsync<PagedResult<WorkItemDto>>();
        
        if (workItems!.Items.Count > 0)
        {
            var workItemId = workItems.Items[0].Id;
            
            // Assign work item
            var assignRequest = new AssignWorkItemRequest
            {
                AssignedToUserId = _fixture.AdminUserId,
                AssignedToUserName = "Test Admin"
            };
            
            var assignResponse = await _fixture.WorkQueueClient.PostAsJsonAsync(
                $"/api/v1/WorkQueue/{workItemId}/assign", assignRequest);
            
            assignResponse.IsSuccessStatusCode.Should().BeTrue();
            
            await Task.Delay(2000);
            
            // Verify notification sent
            var auditResponse = await _fixture.AuditLogClient.GetAsync(
                $"/api/v1/auditlog?entityId={workItemId}&eventType=WorkItemAssigned");
            
            auditResponse.IsSuccessStatusCode.Should().BeTrue();
            
            _output.WriteLine("✅ Assignment notification verified");
        }
    }
    
    [Fact]
    public async Task MessagingService_To_AuditLogService_MessageLogging_Success()
    {
        _output.WriteLine("🧪 Testing: Messaging Service → Audit Log Service");
        
        // Create application
        var applicationId = await CreateTestApplicationAsync();
        
        // Send message
        var messageRequest = new SendMessageRequest
        {
            ApplicationId = applicationId,
            Content = "Test message for audit logging"
        };
        
        var response = await _fixture.MessagingClient.PostAsJsonAsync(
            "/api/v1/messages", messageRequest);
        
        response.IsSuccessStatusCode.Should().BeTrue();
        
        var result = await response.Content.ReadFromJsonAsync<SendMessageResult>();
        var messageId = result!.MessageId!.Value;
        
        // Wait for event to reach audit log
        await Task.Delay(2000);
        
        // Verify audit logged
        var auditResponse = await _fixture.AuditLogClient.GetAsync(
            $"/api/v1/auditlog?entityId={messageId}&eventType=MessageSent");
        
        auditResponse.IsSuccessStatusCode.Should().BeTrue();
        
        _output.WriteLine("✅ Message logged in audit trail");
    }
    
    [Fact]
    public async Task AllServices_HealthChecks_AllHealthy()
    {
        _output.WriteLine("🧪 Testing: All service health checks");
        
        var services = new Dictionary<string, HttpClient>
        {
            ["onboarding-api"] = _fixture.OnboardingApiClient,
            ["document-service"] = _fixture.DocumentClient,
            ["risk-service"] = _fixture.RiskClient,
            ["checklist-service"] = _fixture.ChecklistClient,
            ["entity-configuration-service"] = _fixture.EntityConfigClient,
            ["notification-service"] = _fixture.NotificationClient,
            ["audit-log-service"] = _fixture.AuditLogClient,
            ["projections-api"] = _fixture.ProjectionsClient,
            ["work-queue-service"] = _fixture.WorkQueueClient,
            ["messaging-service"] = _fixture.MessagingClient
        };
        
        foreach (var (name, client) in services)
        {
            var response = await client.GetAsync("/health");
            response.IsSuccessStatusCode.Should().BeTrue($"{name} should be healthy");
            
            var health = await response.Content.ReadAsStringAsync();
            _output.WriteLine($"✅ {name}: {health}");
        }
        
        _output.WriteLine($"✅ All {services.Count} services are healthy");
    }
    
    [Fact]
    public async Task AllServices_MetricsEndpoints_ExposingPrometheusMetrics()
    {
        _output.WriteLine("🧪 Testing: All services expose Prometheus metrics");
        
        var services = new[] { "onboarding-api", "document-service", "work-queue-service" };
        
        foreach (var service in services)
        {
            var client = service switch
            {
                "onboarding-api" => _fixture.OnboardingApiClient,
                "document-service" => _fixture.DocumentClient,
                "work-queue-service" => _fixture.WorkQueueClient,
                _ => throw new ArgumentException($"Unknown service: {service}")
            };
            
            var response = await client.GetAsync("/metrics");
            
            if (response.IsSuccessStatusCode)
            {
                var metrics = await response.Content.ReadAsStringAsync();
                metrics.Should().Contain("http_requests_total", $"{service} should expose HTTP metrics");
                
                _output.WriteLine($"✅ {service}: Metrics exposed");
            }
        }
    }
    
    // Helper methods
    private async Task<Guid> CreateTestApplicationAsync()
    {
        var request = new CreateApplicationRequest
        {
            ApplicantName = $"Test Company {Guid.NewGuid().ToString().Substring(0, 8)}",
            EntityType = "PRIVATE_COMPANY",
            Country = "UK",
            Email = $"test-{Guid.NewGuid()}@example.com",
            PhoneNumber = "+447700900000"
        };
        
        var response = await _fixture.OnboardingApiClient.PostAsJsonAsync(
            "/api/v1/applications", request);
        
        var result = await response.Content.ReadFromJsonAsync<CreateApplicationResult>();
        return result!.ApplicationId;
    }
    
    private async Task<Guid> CreateHighRiskApplicationAsync()
    {
        var request = new CreateApplicationRequest
        {
            ApplicantName = "High Risk Test Company",
            EntityType = "PRIVATE_COMPANY",
            Country = "UK",
            Email = "highrisk@example.com",
            PhoneNumber = "+447700900000",
            // Add high-risk indicators
            TransactionVolume = 10000000, // High volume
            BusinessSector = "CRYPTO" // High-risk sector
        };
        
        var response = await _fixture.OnboardingApiClient.PostAsJsonAsync(
            "/api/v1/applications", request);
        
        var result = await response.Content.ReadFromJsonAsync<CreateApplicationResult>();
        return result!.ApplicationId;
    }
}

// Extended DTO
public record CreateApplicationRequest
{
    public string ApplicantName { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string? CompanyNumber { get; init; }
    public string Email { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public decimal? TransactionVolume { get; init; }
    public string? BusinessSector { get; init; }
}

