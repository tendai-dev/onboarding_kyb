using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Presentation.Models;
using Xunit;

namespace OnboardingApi.Tests.Integration.Api;

public class OnboardingCasesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public OnboardingCasesControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task CreateOnboardingCase_ShouldReturn201_WithValidRequest()
    {
        // Arrange
        var request = new CreateOnboardingCaseRequest
        {
            Type = OnboardingType.Individual,
            PartnerId = Guid.NewGuid(),
            PartnerReferenceId = "PART-TEST-001",
            Applicant = new ApplicantDetailsDto
            {
                FirstName = "John",
                LastName = "Doe",
                DateOfBirth = new DateTime(1990, 1, 1),
                Email = "john.doe@example.com",
                PhoneNumber = "+1234567890",
                ResidentialAddress = new AddressDto
                {
                    Street = "123 Main St",
                    City = "New York",
                    State = "NY",
                    PostalCode = "10001",
                    Country = "US"
                },
                Nationality = "US"
            }
        };

        var idempotencyKey = Guid.NewGuid();
        _client.DefaultRequestHeaders.Add("Idempotency-Key", idempotencyKey.ToString());
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        // Act
        var response = await _client.PostAsJsonAsync("/onboarding/v1/cases", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<OnboardingCaseResponse>>();
        result.Should().NotBeNull();
        result!.Data.Id.Should().NotBeEmpty();
        result.Data.CaseNumber.Should().StartWith("OBC-");
    }

    [Fact]
    public async Task CreateOnboardingCase_ShouldReturn422_WithInvalidData()
    {
        // Arrange
        var request = new CreateOnboardingCaseRequest
        {
            Type = OnboardingType.Individual,
            PartnerId = Guid.Empty, // Invalid
            PartnerReferenceId = "",
            Applicant = new ApplicantDetailsDto
            {
                FirstName = "",  // Invalid - required
                LastName = "Doe",
                Email = "invalid-email" // Invalid format
            }
        };

        _client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());

        // Act
        var response = await _client.PostAsJsonAsync("/onboarding/v1/cases", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error.Should().NotBeNull();
        error!.Name.Should().Be("ValidationError");
        error.Details.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CreateOnboardingCase_ShouldReturn400_WithoutIdempotencyKey()
    {
        // Arrange
        var request = CreateValidRequest();

        // Act (no Idempotency-Key header)
        var response = await _client.PostAsJsonAsync("/onboarding/v1/cases", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error!.Name.Should().Be("MissingIdempotencyKey");
    }

    [Fact]
    public async Task CreateOnboardingCase_ShouldReturnCachedResponse_WithSameIdempotencyKey()
    {
        // Arrange
        var request = CreateValidRequest();
        var idempotencyKey = Guid.NewGuid();
        _client.DefaultRequestHeaders.Add("Idempotency-Key", idempotencyKey.ToString());
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        // Act - First request
        var response1 = await _client.PostAsJsonAsync("/onboarding/v1/cases", request);
        var result1 = await response1.Content.ReadFromJsonAsync<ApiResponse<OnboardingCaseResponse>>();

        // Act - Second request with same idempotency key
        var response2 = await _client.PostAsJsonAsync("/onboarding/v1/cases", request);
        var result2 = await response2.Content.ReadFromJsonAsync<ApiResponse<OnboardingCaseResponse>>();

        // Assert
        response1.StatusCode.Should().Be(HttpStatusCode.Created);
        response2.StatusCode.Should().Be(HttpStatusCode.Created);
        result1!.Data.Id.Should().Be(result2!.Data.Id); // Same case ID returned
    }

    [Fact]
    public async Task GetOnboardingCase_ShouldReturn200_WhenCaseExists()
    {
        // Arrange
        var createdCase = await CreateTestCase();
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        // Act
        var response = await _client.GetAsync($"/onboarding/v1/cases/{createdCase.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<OnboardingCaseDto>>();
        result.Should().NotBeNull();
        result!.Data.Id.Should().Be(createdCase.Id);
        result.Data.CaseNumber.Should().Be(createdCase.CaseNumber);
    }

    [Fact]
    public async Task GetOnboardingCase_ShouldReturn404_WhenCaseNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        // Act
        var response = await _client.GetAsync($"/onboarding/v1/cases/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        error!.Name.Should().Be("OnboardingCaseNotFound");
    }

    [Fact]
    public async Task HealthCheck_ShouldReturn200()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact]
    public async Task GetOnboardingCase_ShouldIncludeETagHeader()
    {
        // Arrange
        var createdCase = await CreateTestCase();
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        // Act
        var response = await _client.GetAsync($"/onboarding/v1/cases/{createdCase.Id}");

        // Assert
        response.Headers.ETag.Should().NotBeNull();
    }

    [Fact]
    public async Task GetOnboardingCase_ShouldReturn304_WhenETagMatches()
    {
        // Arrange
        var createdCase = await CreateTestCase();
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        // First request to get ETag
        var response1 = await _client.GetAsync($"/onboarding/v1/cases/{createdCase.Id}");
        var etag = response1.Headers.ETag;

        // Act - Second request with If-None-Match
        _client.DefaultRequestHeaders.Add("If-None-Match", etag!.ToString());
        var response2 = await _client.GetAsync($"/onboarding/v1/cases/{createdCase.Id}");

        // Assert
        response2.StatusCode.Should().Be(HttpStatusCode.NotModified);
    }

    // Helper methods
    private static CreateOnboardingCaseRequest CreateValidRequest()
    {
        return new CreateOnboardingCaseRequest
        {
            Type = OnboardingType.Individual,
            PartnerId = Guid.NewGuid(),
            PartnerReferenceId = $"PART-TEST-{Guid.NewGuid()}",
            Applicant = new ApplicantDetailsDto
            {
                FirstName = "John",
                LastName = "Doe",
                DateOfBirth = new DateTime(1990, 1, 1),
                Email = "john.doe@example.com",
                PhoneNumber = "+1234567890",
                ResidentialAddress = new AddressDto
                {
                    Street = "123 Main St",
                    City = "New York",
                    State = "NY",
                    PostalCode = "10001",
                    Country = "US"
                },
                Nationality = "US"
            }
        };
    }

    private async Task<OnboardingCaseResponse> CreateTestCase()
    {
        var request = CreateValidRequest();
        _client.DefaultRequestHeaders.Clear();
        _client.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token");

        var response = await _client.PostAsJsonAsync("/onboarding/v1/cases", request);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<OnboardingCaseResponse>>();

        return result!.Data;
    }
}

