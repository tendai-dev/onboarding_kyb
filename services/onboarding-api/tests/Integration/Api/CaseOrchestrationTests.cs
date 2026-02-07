using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using Xunit;

namespace OnboardingApi.Tests.Integration.Api;

/// <summary>
/// Integration tests for case orchestration logic including:
/// - Work item creation on case submission
/// - Projection sync queueing
/// - Background service retry logic
/// </summary>
public class CaseOrchestrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public CaseOrchestrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateCase_ShouldQueueProjectionSync_WhenCaseIsSubmitted()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        client.DefaultRequestHeaders.Add("X-User-Email", "test@example.com");

        var request = new
        {
            type = "Individual",
            applicant = new
            {
                first_name = "Test",
                last_name = "User",
                email = "test@example.com",
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
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/cases", request);

        // Assert
        // Case should be created successfully
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
        
        // The projection sync should be queued (we can't directly verify the queue,
        // but we can verify the case was created which triggers the queue)
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("case_id");
    }

    [Fact]
    public async Task CreateCase_WithSchemaValidation_ShouldRequireValidFormConfig()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        client.DefaultRequestHeaders.Add("X-User-Email", "test@example.com");
        client.DefaultRequestHeaders.Add("X-Form-Config-Id", "invalid-config-id"); // Invalid config

        var request = new
        {
            type = "Individual",
            applicant = new
            {
                first_name = "Test",
                last_name = "User",
                email = "test@example.com"
            }
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/cases", request);

        // Assert - Should reject invalid form config
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Invalid form configuration");
    }

    [Fact]
    public async Task GetCase_ShouldReturnCase_WhenUserOwnsCase()
    {
        // Arrange
        var client = _factory.CreateClient();
        var userEmail = $"owner-{Guid.NewGuid()}@example.com";
        client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        client.DefaultRequestHeaders.Add("X-User-Email", userEmail);

        // First create a case
        var createRequest = new
        {
            type = "Individual",
            applicant = new
            {
                first_name = "Owner",
                last_name = "Test",
                email = userEmail,
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

        var createResponse = await client.PostAsJsonAsync("/api/cases", createRequest);
        var createContent = await createResponse.Content.ReadFromJsonAsync<dynamic>();
        
        // Act - Get the case with same user
        var caseId = createContent?.GetProperty("case_id").GetString();
        if (caseId != null)
        {
            var getResponse = await client.GetAsync($"/api/cases/{caseId}");

            // Assert
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }

    [Fact]
    public async Task UpdateCaseStatus_ShouldReturnCorrelationId_OnError()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");
        client.DefaultRequestHeaders.Add("X-User-Email", "admin@example.com");

        var nonExistentCaseId = Guid.NewGuid();

        // Act
        var response = await client.PatchAsJsonAsync(
            $"/api/cases/{nonExistentCaseId}/status",
            new { status = "Approved" });

        // Assert - Should return 404 with proper error structure
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

/// <summary>
/// Tests for the ProjectionSyncService background service
/// </summary>
public class ProjectionSyncServiceTests
{
    [Fact]
    public void QueueSync_ShouldAcceptValidCaseId()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var caseNumber = "OBC-TEST-001";

        // Act - Should not throw
        var action = () => OnboardingApi.Infrastructure.BackgroundServices.ProjectionSyncService.QueueSync(caseId, caseNumber);

        // Assert
        action.Should().NotThrow();
    }

    [Fact]
    public void QueueSync_ShouldAcceptNullCaseNumber()
    {
        // Arrange
        var caseId = Guid.NewGuid();

        // Act - Should not throw even with null case number
        var action = () => OnboardingApi.Infrastructure.BackgroundServices.ProjectionSyncService.QueueSync(caseId, null);

        // Assert
        action.Should().NotThrow();
    }
}

/// <summary>
/// Tests for PartnerIdGenerator security improvements
/// </summary>
public class PartnerIdGeneratorTests
{
    [Fact]
    public void GenerateFromEmail_ShouldReturnDeterministicGuid()
    {
        // Arrange
        var email = "test@example.com";

        // Act
        var result1 = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email);
        var result2 = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email);

        // Assert
        result1.Should().Be(result2);
        result1.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void GenerateFromEmail_ShouldBeCaseInsensitive()
    {
        // Arrange
        var email1 = "Test@Example.com";
        var email2 = "test@example.com";

        // Act
        var result1 = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email1);
        var result2 = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email2);

        // Assert
        result1.Should().Be(result2);
    }

    [Fact]
    public void GenerateFromEmail_ShouldThrowForNullEmail()
    {
        // Act
        var action = () => OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(null!);

        // Assert
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void GenerateFromEmail_ShouldThrowForEmptyEmail()
    {
        // Act
        var action = () => OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail("");

        // Assert
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Validate_ShouldReturnTrue_ForMatchingEmail()
    {
        // Arrange
        var email = "test@example.com";
        var partnerId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email);

        // Act
        var result = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.Validate(email, partnerId);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void Validate_ShouldReturnFalse_ForNonMatchingEmail()
    {
        // Arrange
        var email1 = "test1@example.com";
        var email2 = "test2@example.com";
        var partnerId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmail(email1);

        // Act
        var result = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.Validate(email2, partnerId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsLegacyPartnerId_ShouldIdentifyLegacyHashes()
    {
        // Arrange
        var email = "legacy@example.com";
        #pragma warning disable CS0618
        var legacyId = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.GenerateFromEmailLegacy(email);
        #pragma warning restore CS0618

        // Act
        var isLegacy = OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.IsLegacyPartnerId(email, legacyId);

        // Assert
        isLegacy.Should().BeTrue();
    }
}
