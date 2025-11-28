using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class EntityConfigurationServiceTests
{
    private readonly MockLogger<EntityConfigurationService> _logger;
    private readonly MockConfiguration _configuration;
    private readonly MockHttpClientFactoryForEntityConfig _httpClientFactory;

    public EntityConfigurationServiceTests()
    {
        _logger = new MockLogger<EntityConfigurationService>();
        _configuration = new MockConfiguration();
        _httpClientFactory = new MockHttpClientFactoryForEntityConfig();
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldReturnConfiguration_WhenRequestSucceeds()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var response = new EntityTypeResponse
        {
            Code = "INDIVIDUAL",
            DisplayName = "Individual",
            Requirements = new List<EntityTypeRequirementResponse>
            {
                new EntityTypeRequirementResponse
                {
                    Requirement = new RequirementResponse
                    {
                        Code = "PASSPORT",
                        DisplayName = "Passport",
                        FieldType = "file",
                        Type = "document"
                    },
                    IsRequired = true
                }
            }
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
        Assert.Equal("INDIVIDUAL", result.EntityTypeCode);
        Assert.Equal("Individual", result.DisplayName);
        Assert.Single(result.Requirements);
        Assert.Equal("PASSPORT", result.Requirements[0].Code);
        Assert.True(result.Requirements[0].IsRequired);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldReturnNull_WhenRequestFails()
    {
        // Arrange
        var entityTypeCode = "INVALID";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var httpResponse = new HttpResponseMessage(HttpStatusCode.NotFound);
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{entityTypeCode}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldReturnNull_WhenResponseIsInvalid()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        var httpResponse = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("invalid json", Encoding.UTF8, "application/json")
        };
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{entityTypeCode}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldUseDefaultBaseUrl_WhenNotConfigured()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
        var defaultBaseUrl = "http://localhost:8003";

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
        _httpClientFactory.SetupResponse($"{defaultBaseUrl}/api/v1/entity-types/{entityTypeCode}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationByIdAsync_ShouldReturnConfiguration_WhenRequestSucceeds()
    {
        // Arrange
        var formConfigId = "form-123";
        var baseUrl = "http://localhost:8003";
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
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{formConfigId}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationByIdAsync(formConfigId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("INDIVIDUAL", result.EntityTypeCode);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationByIdAsync_ShouldIncludeVersion_WhenProvided()
    {
        // Arrange
        var formConfigId = "form-123";
        var version = "v2";
        var baseUrl = "http://localhost:8003";
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
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{formConfigId}?version={version}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationByIdAsync(formConfigId, version);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldReturnNull_WhenExceptionOccurs()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
        var baseUrl = "http://localhost:8003";
        _configuration.SetValue("Services:EntityConfiguration:BaseUrl", baseUrl);

        _httpClientFactory.SetupException($"{baseUrl}/api/v1/entity-types/{entityTypeCode}", new HttpRequestException("Connection failed"));

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetEntityTypeConfigurationAsync_ShouldHandleEmptyRequirements()
    {
        // Arrange
        var entityTypeCode = "INDIVIDUAL";
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
        _httpClientFactory.SetupResponse($"{baseUrl}/api/v1/entity-types/{entityTypeCode}", httpResponse);

        var service = new EntityConfigurationService(_httpClientFactory, _configuration, _logger);

        // Act
        var result = await service.GetEntityTypeConfigurationAsync(entityTypeCode);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Requirements);
    }
}

public class MockHttpClientFactoryForEntityConfig : IHttpClientFactory
{
    private readonly Dictionary<string, Func<HttpRequestMessage, Task<HttpResponseMessage>>> _responses = new();
    private readonly Dictionary<string, Exception> _exceptions = new();

    public void SetupResponse(string url, HttpResponseMessage response)
    {
        _responses[url] = async request =>
        {
            await Task.Delay(10); // Simulate network delay
            return response;
        };
    }

    public void SetupException(string url, Exception exception)
    {
        _exceptions[url] = exception;
    }

    public HttpClient CreateClient(string name)
    {
        var handler = new MockHttpMessageHandlerForEntityConfig(_responses, _exceptions);
        return new HttpClient(handler);
    }
}

public class MockHttpMessageHandlerForEntityConfig : HttpMessageHandler
{
    private readonly Dictionary<string, Func<HttpRequestMessage, Task<HttpResponseMessage>>> _responses;
    private readonly Dictionary<string, Exception> _exceptions;

    public MockHttpMessageHandlerForEntityConfig(
        Dictionary<string, Func<HttpRequestMessage, Task<HttpResponseMessage>>> responses,
        Dictionary<string, Exception> exceptions)
    {
        _responses = responses;
        _exceptions = exceptions;
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

public class MockConfiguration : IConfiguration
{
    private readonly Dictionary<string, string> _values = new();

    public void SetValue(string key, string value)
    {
        _values[key] = value;
    }

    public string? this[string key]
    {
        get => _values.TryGetValue(key, out var value) ? value : null;
        set => _values[key] = value ?? string.Empty;
    }

    public IEnumerable<IConfigurationSection> GetChildren()
    {
        return Array.Empty<IConfigurationSection>();
    }

    public IChangeToken GetReloadToken()
    {
        return new MockChangeToken();
    }

    public IConfigurationSection GetSection(string key)
    {
        return new MockConfigurationSection(key, this[key]);
    }
}

public class MockConfigurationSection : IConfigurationSection
{
    private readonly string _key;
    private readonly string? _value;

    public MockConfigurationSection(string key, string? value)
    {
        _key = key;
        _value = value;
    }

    public string Key => _key;
    public string Path => _key;
    public string? Value
    {
        get => _value;
        set => throw new NotSupportedException();
    }

    public string? this[string key]
    {
        get => null;
        set => throw new NotSupportedException();
    }

    public IEnumerable<IConfigurationSection> GetChildren()
    {
        return Array.Empty<IConfigurationSection>();
    }

    public IChangeToken GetReloadToken()
    {
        return new MockChangeToken();
    }

    public IConfigurationSection GetSection(string key)
    {
        return new MockConfigurationSection(key, null);
    }
}

public class MockChangeToken : IChangeToken
{
    public bool HasChanged => false;
    public bool ActiveChangeCallbacks => false;
    public IDisposable RegisterChangeCallback(Action<object?> callback, object? state)
    {
        return new MockDisposable();
    }
}

public class MockDisposable : IDisposable
{
    public void Dispose() { }
}

