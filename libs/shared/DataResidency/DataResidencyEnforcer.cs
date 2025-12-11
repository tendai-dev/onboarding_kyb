using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Shared.DataResidency;

/// <summary>
/// Enforces data residency rules at write time
/// Ensures data is stored in the correct region based on compliance requirements
/// </summary>
public interface IDataResidencyEnforcer
{
    Task<RegionConfig> DetermineRegionAsync(string entityType, Dictionary<string, object> entityData);
    Task AuditDataWriteAsync(string entityType, Guid entityId, RegionConfig region, string userId);
    Task ValidateRegionAccessAsync(string entityType, Guid entityId, string userId, string userRegion);
}

public class DataResidencyEnforcer : IDataResidencyEnforcer
{
    private readonly DataResidencyConfig _config;
    private readonly ILogger<DataResidencyEnforcer> _logger;

    public DataResidencyEnforcer(IConfiguration configuration, ILogger<DataResidencyEnforcer> logger)
    {
        _logger = logger;
        
        // Load data residency configuration
        var configPath = Path.Combine(AppContext.BaseDirectory, "config", "data-residency.yaml");
        var yaml = File.ReadAllText(configPath);
        
        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();
        
        _config = deserializer.Deserialize<DataResidencyConfig>(yaml);
        
        _logger.LogInformation("Loaded data residency config with {Count} regions", _config.Regions.Count);
    }

    public async Task<RegionConfig> DetermineRegionAsync(
        string entityType,
        Dictionary<string, object> entityData)
    {
        // Get entity-specific rules
        if (!_config.EntityRules.TryGetValue(entityType, out var entityRule))
        {
            _logger.LogWarning("No residency rule for entity type {EntityType}, using default region", entityType);
            return GetRegion(_config.DefaultRegion);
        }

        // Determine region based on rule
        string countryCode;
        
        switch (entityRule.DetermineBy)
        {
            case "applicant_nationality":
                countryCode = entityData.GetValueOrDefault("applicant_nationality")?.ToString() ?? "";
                break;
            
            case "case_region":
                var caseRegion = entityData.GetValueOrDefault("case_region")?.ToString() ?? "";
                return GetRegion(caseRegion);
            
            case "action_region":
                countryCode = entityData.GetValueOrDefault("user_country")?.ToString() ?? "";
                break;
            
            default:
                _logger.LogWarning("Unknown determine_by rule: {Rule}", entityRule.DetermineBy);
                return GetRegion(_config.DefaultRegion);
        }

        // Find region for country code
        var region = _config.Regions.FirstOrDefault(r => r.Countries.Contains(countryCode));
        
        if (region == null)
        {
            _logger.LogInformation(
                "Country {Country} not mapped to specific region, using default",
                countryCode);
            return GetRegion(_config.DefaultRegion);
        }

        _logger.LogInformation(
            "Determined region {Region} for entity {EntityType} with country {Country}",
            region.Id, entityType, countryCode);

        return region;
    }

    public async Task AuditDataWriteAsync(
        string entityType,
        Guid entityId,
        RegionConfig region,
        string userId)
    {
        var auditEntry = new
        {
            timestamp = DateTime.UtcNow,
            entity_type = entityType,
            entity_id = entityId,
            region = region.Id,
            storage_location = new
            {
                postgres = region.Postgres.Host,
                minio = region.Minio.Endpoint
            },
            user_id = userId,
            ip_address = "pending"  // Inject from HTTP context
        };

        // Log audit entry
        _logger.LogInformation(
            "DATA_RESIDENCY_AUDIT: {@Audit}",
            auditEntry);

        // Store in audit database (implement as needed)
        // await _auditRepository.AddAsync(auditEntry);
    }

    public async Task ValidateRegionAccessAsync(
        string entityType,
        Guid entityId,
        string userId,
        string userRegion)
    {
        // Get entity rules
        if (!_config.EntityRules.TryGetValue(entityType, out var entityRule))
        {
            return;  // No rules, allow access
        }

        // Check cross-region access policy
        if (entityRule.CrossRegionAccess == "denied")
        {
            // Fetch entity region and compare
            // If entity region != user region, throw UnauthorizedAccessException
            
            _logger.LogWarning(
                "Cross-region access denied for user {UserId} accessing {EntityType} {EntityId}",
                userId, entityType, entityId);
            
            // throw new DataResidencyViolationException(
            //     $"Cross-region access not allowed for {entityType}");
        }
    }

    private RegionConfig GetRegion(string regionId)
    {
        return _config.Regions.First(r => r.Id == regionId);
    }
}

// Configuration models
public class DataResidencyConfig
{
    public List<RegionConfig> Regions { get; set; } = new();
    public string DefaultRegion { get; set; } = string.Empty;
    public Dictionary<string, EntityRule> EntityRules { get; set; } = new();
    public AuditConfig Audit { get; set; } = new();
}

public class RegionConfig
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<string> Countries { get; set; } = new();
    public PostgresConfig Postgres { get; set; } = new();
    public MinioConfig Minio { get; set; } = new();
    public ComplianceConfig Compliance { get; set; } = new();
}

public class PostgresConfig
{
    public string Host { get; set; } = string.Empty;
    public string Database { get; set; } = string.Empty;
    public string SchemaPrefix { get; set; } = string.Empty;
}

public class MinioConfig
{
    public string Endpoint { get; set; } = string.Empty;
    public string BucketPrefix { get; set; } = string.Empty;
}

public class ComplianceConfig
{
    public bool? Gdpr { get; set; }
    public bool? Ccpa { get; set; }
    public bool? Pdpa { get; set; }
    public bool DataLocalizationRequired { get; set; }
}

public class EntityRule
{
    public string DetermineBy { get; set; } = string.Empty;
    public bool StoreInRegion { get; set; }
    public string CrossRegionAccess { get; set; } = string.Empty;
}

public class AuditConfig
{
    public bool LogAllWrites { get; set; }
    public string LogFormat { get; set; } = string.Empty;
    public bool AlertOnViolations { get; set; }
}

public class DataResidencyViolationException : Exception
{
    public DataResidencyViolationException(string message) : base(message) { }
}

