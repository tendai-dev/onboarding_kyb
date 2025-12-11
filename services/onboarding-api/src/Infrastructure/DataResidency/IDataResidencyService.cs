namespace OnboardingApi.Infrastructure.DataResidency;

/// <summary>
/// Service for enforcing data residency requirements based on country
/// </summary>
public interface IDataResidencyService
{
    /// <summary>
    /// Get the appropriate region for a given country code
    /// </summary>
    Task<RegionConfig> GetRegionForCountryAsync(string countryCode);
    
    /// <summary>
    /// Get database connection string for a specific region
    /// </summary>
    Task<string> GetDatabaseConnectionStringAsync(string regionCode);
    
    /// <summary>
    /// Get storage configuration for a specific region
    /// </summary>
    Task<StorageConfig> GetStorageConfigAsync(string regionCode);
    
    /// <summary>
    /// Get Kafka configuration for a specific region
    /// </summary>
    Task<KafkaConfig> GetKafkaConfigAsync(string regionCode);
    
    /// <summary>
    /// Validate if data can be stored in a specific region for compliance
    /// </summary>
    Task<DataResidencyValidation> ValidateDataResidencyAsync(string countryCode, string regionCode);
    
    /// <summary>
    /// Get retention policy for a data type
    /// </summary>
    Task<int> GetRetentionPeriodDaysAsync(string dataType);
}

public record RegionConfig
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public List<string> Countries { get; init; } = new();
    public DatabaseConfig Database { get; init; } = new();
    public StorageConfig Storage { get; init; } = new();
    public KafkaConfig Kafka { get; init; } = new();
}

public record DatabaseConfig
{
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 5432;
    public string Database { get; init; } = string.Empty;
    public bool Ssl { get; init; } = true;
}

public record StorageConfig
{
    public string Endpoint { get; init; } = string.Empty;
    public string BucketPrefix { get; init; } = string.Empty;
    public bool Ssl { get; init; } = true;
    public string Region { get; init; } = string.Empty;
}

public record KafkaConfig
{
    public string BootstrapServers { get; init; } = string.Empty;
}

public record DataResidencyValidation
{
    public bool IsValid { get; init; }
    public string? ViolationReason { get; init; }
    public string ExpectedRegion { get; init; } = string.Empty;
    public string ActualRegion { get; init; } = string.Empty;
}

