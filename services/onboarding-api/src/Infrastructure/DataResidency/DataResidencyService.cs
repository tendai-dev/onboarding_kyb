using Microsoft.Extensions.Logging;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace OnboardingApi.Infrastructure.DataResidency;

/// <summary>
/// Implementation of data residency service using YAML configuration
/// </summary>
public class DataResidencyService : IDataResidencyService
{
    private readonly ILogger<DataResidencyService> _logger;
    private readonly DataResidencyConfig _config;
    private readonly Dictionary<string, RegionConfig> _regionsByCode;
    private readonly Dictionary<string, string> _countryToRegion;
    
    public DataResidencyService(ILogger<DataResidencyService> logger, string configPath = "/app/config/data-residency.yaml")
    {
        _logger = logger;
        _config = LoadConfiguration(configPath);
        
        // Build lookup dictionaries for fast access
        _regionsByCode = _config.Regions.ToDictionary(r => r.Code, r => r);
        _countryToRegion = new Dictionary<string, string>();
        
        foreach (var region in _config.Regions)
        {
            foreach (var country in region.Countries)
            {
                _countryToRegion[country.ToUpper()] = region.Code;
            }
        }
    }
    
    public Task<RegionConfig> GetRegionForCountryAsync(string countryCode)
    {
        var normalizedCountry = countryCode.ToUpper();
        
        if (_countryToRegion.TryGetValue(normalizedCountry, out var regionCode))
        {
            _logger.LogInformation(
                "Country {Country} mapped to region {Region}",
                countryCode, regionCode);
            
            return Task.FromResult(_regionsByCode[regionCode]);
        }
        
        _logger.LogWarning(
            "Country {Country} not found in residency config, using default region {DefaultRegion}",
            countryCode, _config.DefaultRegion);
        
        return Task.FromResult(_regionsByCode[_config.DefaultRegion]);
    }
    
    public async Task<string> GetDatabaseConnectionStringAsync(string regionCode)
    {
        if (!_regionsByCode.TryGetValue(regionCode, out var region))
        {
            throw new InvalidOperationException($"Region not found: {regionCode}");
        }
        
        var dbConfig = region.Database;
        var connectionString = $"Host={dbConfig.Host};Port={dbConfig.Port};Database={dbConfig.Database};";
        
        if (dbConfig.Ssl)
        {
            connectionString += "SSL Mode=Require;";
        }
        
        // Add credentials from environment (not in YAML for security)
        var username = Environment.GetEnvironmentVariable($"DB_{regionCode}_USERNAME") ?? "postgres";
        var password = Environment.GetEnvironmentVariable($"DB_{regionCode}_PASSWORD");
        
        connectionString += $"Username={username};Password={password};";
        
        _logger.LogInformation(
            "Retrieved database connection for region {Region}",
            regionCode);
        
        return await Task.FromResult(connectionString);
    }
    
    public Task<StorageConfig> GetStorageConfigAsync(string regionCode)
    {
        if (!_regionsByCode.TryGetValue(regionCode, out var region))
        {
            throw new InvalidOperationException($"Region not found: {regionCode}");
        }
        
        _logger.LogInformation(
            "Retrieved storage config for region {Region}: {Endpoint}",
            regionCode, region.Storage.Endpoint);
        
        return Task.FromResult(region.Storage);
    }
    
    public Task<KafkaConfig> GetKafkaConfigAsync(string regionCode)
    {
        if (!_regionsByCode.TryGetValue(regionCode, out var region))
        {
            throw new InvalidOperationException($"Region not found: {regionCode}");
        }
        
        _logger.LogInformation(
            "Retrieved Kafka config for region {Region}: {BootstrapServers}",
            regionCode, region.Kafka.BootstrapServers);
        
        return Task.FromResult(region.Kafka);
    }
    
    public async Task<DataResidencyValidation> ValidateDataResidencyAsync(string countryCode, string regionCode)
    {
        var expectedRegion = await GetRegionForCountryAsync(countryCode);
        
        if (expectedRegion.Code == regionCode)
        {
            _logger.LogInformation(
                "Data residency validated: Country {Country} correctly stored in region {Region}",
                countryCode, regionCode);
            
            return new DataResidencyValidation
            {
                IsValid = true,
                ExpectedRegion = expectedRegion.Code,
                ActualRegion = regionCode
            };
        }
        
        _logger.LogError(
            "Data residency violation: Country {Country} data found in region {ActualRegion}, expected {ExpectedRegion}",
            countryCode, regionCode, expectedRegion.Code);
        
        // Alert compliance team
        if (_config.Audit.AlertOnResidencyViolation)
        {
            await AlertResidencyViolationAsync(countryCode, regionCode, expectedRegion.Code);
        }
        
        return new DataResidencyValidation
        {
            IsValid = false,
            ViolationReason = $"Country {countryCode} data must be stored in region {expectedRegion.Code}, not {regionCode}",
            ExpectedRegion = expectedRegion.Code,
            ActualRegion = regionCode
        };
    }
    
    public Task<int> GetRetentionPeriodDaysAsync(string dataType)
    {
        if (_config.RetentionPolicies.TryGetValue(dataType, out var days))
        {
            _logger.LogDebug(
                "Retention period for {DataType}: {Days} days",
                dataType, days);
            
            return Task.FromResult(days);
        }
        
        _logger.LogWarning(
            "No retention policy found for {DataType}, using default 1825 days (5 years)",
            dataType);
        
        return Task.FromResult(1825); // Default: 5 years
    }
    
    private async Task AlertResidencyViolationAsync(string country, string actualRegion, string expectedRegion)
    {
        try
        {
            _logger.LogCritical(
                "COMPLIANCE ALERT: Data residency violation detected. Country={Country}, Actual={Actual}, Expected={Expected}",
                country, actualRegion, expectedRegion);
            
            // TODO: Send email to compliance team
            // This would integrate with notification service
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send residency violation alert");
        }
        
        await Task.CompletedTask;
    }
    
    private DataResidencyConfig LoadConfiguration(string configPath)
    {
        try
        {
            var yaml = File.ReadAllText(configPath);
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(UnderscoredNamingConvention.Instance)
                .Build();
            
            return deserializer.Deserialize<DataResidencyConfig>(yaml);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load data residency configuration from {Path}", configPath);
            throw new InvalidOperationException("Failed to load data residency configuration", ex);
        }
    }
}

// Configuration models matching YAML structure
internal class DataResidencyConfig
{
    public string Version { get; set; } = string.Empty;
    public List<RegionConfig> Regions { get; set; } = new();
    public string DefaultRegion { get; set; } = "ZA";
    public Dictionary<string, int> RetentionPolicies { get; set; } = new();
    public List<string> PiiFields { get; set; } = new();
    public AuditConfig Audit { get; set; } = new();
}

internal class AuditConfig
{
    public bool LogAllDataAccess { get; set; }
    public bool LogCrossRegionAccess { get; set; }
    public bool AlertOnResidencyViolation { get; set; }
    public string ComplianceTeamEmail { get; set; } = string.Empty;
}

