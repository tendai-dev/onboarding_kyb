using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class EntityConfigurationServiceEdgeCaseTests
{
    private readonly MockLogger<EntityConfigurationService> _logger;
    private readonly MockConfiguration _configuration;
    private readonly MockHttpClientFactoryForEntityConfig _httpClientFactory;

    public EntityConfigurationServiceEdgeCaseTests()
    {
        _logger = new MockLogger<EntityConfigurationService>();
        _configuration = new MockConfiguration();
        _httpClientFactory = new MockHttpClientFactoryForEntityConfig();
    }

    [Fact]
    public async Task GetEntityTypeConfigurationByIdAsync_ShouldReturnNull_WhenRequestFails()
    {
        // Arrange
        var formConfigId = "invalid-id";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var httpResponse = new HttpResponseMessage(HttpStatusCode.NotFound);
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{formConfigId}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationByIdAsync(formConfigId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationByIdAsync_ShouldReturnNull_WhenExceptionOccurs()
    {
        // Arrange
        var formConfigId = "form-123";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        _httpClientFactory.SetupException($"{baseUrl}/api/v1/entity-types/{formConfigId}", new HttpRequestException("Connection failed"));

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationByIdAsync(formConfigId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldUseAlternativeConfigKey()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("EntityConfig:BaseUrl", baseUrl); // Alternative config key

        var response = new EntityTypeResponse
        {
            Code = "INDIVIDUAL",
            DisplayName = "Individual",
            Requirements = new List<EntityTypeRequirementResponse>()
        };

        var json = JsonSerializer.Serialize(response);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{entityTypeCode}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationByIdAsync_ShouldHandleNullRequirements()
    {
        // Arrange
        var formConfigId = "form-123";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var response = new EntityTypeResponse
        {
            Code = "INDIVIDUAL",
            DisplayName = "Individual",
            Requirements = null
        };

        var json = JsonSerializer.Serialize(response);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{formConfigId}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationByIdAsync(formConfigId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Requirements);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationByIdAsync_ShouldHandleNullRequirementFields()
    {
        // Arrange
        var formConfigId = "form-123";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var response = new EntityTypeResponse
        {
            Code = null,
            DisplayName = null,
            Requirements = new List<EntityTypeRequirementResponse>
            {
                new EntityTypeRequirementResponse
                {
                    Requirement = null,
                    IsRequired = true
                }
            }
        };

        var json = JsonSerializer.Serialize(response);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{formConfigId}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationByIdAsync(formConfigId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(formConfigId, result.EntityTypeCode); // Should use formConfigId as fallback
        Assert.Single(result.Requirements);
        Assert.Equal("", result.Requirements[0].Code); // Should use empty string as fallback
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldTrimBaseUrl()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
        var baseUrl = "http://localhost:8003/"; // With trailing slash
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var response = new EntityTypeResponse
        {
            Code = "INDIVIDUAL",
            DisplayName = "Individual",
            Requirements = new List<EntityTypeRequirementResponse>()
        };

        var json = JsonSerializer.Serialize(response);
        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        var trimmedUrl = baseUrl.TrimEnd('/');
        _httpClientFactory.SetupResponse($"{trimmedUrl}/api/v1/entity-types/{entityTypeCode}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.NotNull(result);
    }
}

