using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Service for fetching entity configuration from Entity Configuration Service
/// </summary>
public interface IEntityConfigurationService
{
    Task<EntityTypeConfiguration?> GetEntityTypeConfigurationAsync(string entityTypeCode, CancellationToken cancellationToken = default);
    Task<EntityTypeConfiguration?> GetEntityTypeConfigurationByIdAsync(string formConfigId, string? version = null, CancellationToken cancellationToken = default);
}

public class EntityConfigurationService : IEntityConfigurationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EntityConfigurationService> _logger;

    public EntityConfigurationService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<EntityConfigurationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<EntityTypeConfiguration?> GetEntityTypeConfigurationAsync(string entityTypeCode, CancellationToken cancellationToken = default)
    {
        try
        {
            var baseUrl = _configuration["Services:EntityConfiguration:BaseUrl"] 
                ?? _configuration["EntityConfig:BaseUrl"] 
                ?? "http://localhost:8003";
            
            baseUrl = baseUrl.TrimEnd('/');
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            // Fetch entity type with requirements
            var url = $"{baseUrl}/api/v1/entity-types/{entityTypeCode}";
            _logger.LogInformation("Fetching entity configuration from {Url}", url);

            var response = await client.GetAsync(url, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch entity configuration: {StatusCode} {Reason}", 
                    response.StatusCode, response.ReasonPhrase);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var entityType = JsonSerializer.Deserialize<EntityTypeResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (entityType == null)
            {
                _logger.LogWarning("Entity type {EntityTypeCode} not found or invalid response", entityTypeCode);
                return null;
            }

            // Build configuration from requirements
            var config = new EntityTypeConfiguration
            {
                EntityTypeCode = entityType.Code ?? entityTypeCode,
                DisplayName = entityType.DisplayName ?? entityTypeCode,
                Requirements = entityType.Requirements?.Select(r => new RequirementConfig
                {
                    Code = r.Requirement?.Code ?? "",
                    DisplayName = r.Requirement?.DisplayName ?? "",
                    FieldType = r.Requirement?.FieldType ?? "text",
                    IsRequired = r.IsRequired,
                    Type = r.Requirement?.Type ?? ""
                }).ToList() ?? new List<RequirementConfig>()
            };

            _logger.LogInformation("Loaded entity configuration for {EntityTypeCode} with {Count} requirements", 
                entityTypeCode, config.Requirements.Count);

            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching entity configuration for {EntityTypeCode}", entityTypeCode);
            return null;
        }
    }

    public async Task<EntityTypeConfiguration?> GetEntityTypeConfigurationByIdAsync(string formConfigId, string? version = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var baseUrl = _configuration["Services:EntityConfiguration:BaseUrl"] 
                ?? _configuration["EntityConfig:BaseUrl"] 
                ?? "http://localhost:8003";
            
            baseUrl = baseUrl.TrimEnd('/');
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            // Fetch entity type by ID (form config ID)
            var url = $"{baseUrl}/api/v1/entity-types/{formConfigId}";
            if (!string.IsNullOrWhiteSpace(version))
            {
                url += $"?version={version}";
            }
            _logger.LogInformation("Fetching entity configuration by ID from {Url} (version: {Version})", url, version ?? "latest");

            var response = await client.GetAsync(url, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch entity configuration by ID: {StatusCode} {Reason}", 
                    response.StatusCode, response.ReasonPhrase);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var entityType = JsonSerializer.Deserialize<EntityTypeResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (entityType == null)
            {
                _logger.LogWarning("Entity type with ID {FormConfigId} not found or invalid response", formConfigId);
                return null;
            }

            // Build configuration from requirements
            var config = new EntityTypeConfiguration
            {
                EntityTypeCode = entityType.Code ?? formConfigId,
                DisplayName = entityType.DisplayName ?? formConfigId,
                Requirements = entityType.Requirements?.Select(r => new RequirementConfig
                {
                    Code = r.Requirement?.Code ?? "",
                    DisplayName = r.Requirement?.DisplayName ?? "",
                    FieldType = r.Requirement?.FieldType ?? "text",
                    IsRequired = r.IsRequired,
                    Type = r.Requirement?.Type ?? ""
                }).ToList() ?? new List<RequirementConfig>()
            };

            _logger.LogInformation("Loaded entity configuration by ID {FormConfigId} (version: {Version}) with {Count} requirements", 
                formConfigId, version ?? "latest", config.Requirements.Count);

            return config;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching entity configuration by ID {FormConfigId}", formConfigId);
            return null;
        }
    }
}

public class EntityTypeConfiguration
{
    public string EntityTypeCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public List<RequirementConfig> Requirements { get; set; } = new();
}

public class RequirementConfig
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string FieldType { get; set; } = "text";
    public bool IsRequired { get; set; }
    public string Type { get; set; } = "";
}

// Response DTOs matching Entity Configuration Service API
public class EntityTypeResponse
{
    public string? Code { get; set; }
    public string? DisplayName { get; set; }
    public List<EntityTypeRequirementResponse>? Requirements { get; set; }
}

public class EntityTypeRequirementResponse
{
    public RequirementResponse? Requirement { get; set; }
    public bool IsRequired { get; set; }
}

public class RequirementResponse
{
    public string? Code { get; set; }
    public string? DisplayName { get; set; }
    public string? FieldType { get; set; }
    public string? Type { get; set; }
}

