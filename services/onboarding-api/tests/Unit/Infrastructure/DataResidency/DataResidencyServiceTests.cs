using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.DataResidency;
using OnboardingApi.Tests.Unit.TestHelpers;
using System.IO;
using System.Text;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.DataResidency;

public class DataResidencyServiceTests : IDisposable
{
    private readonly MockLogger<DataResidencyService> _logger;
    private readonly string _testConfigPath;
    private readonly string _testConfigContent;

    public DataResidencyServiceTests()
    {
        _logger = new MockLogger<DataResidencyService>();
        _testConfigPath = Path.Combine(Path.GetTempPath(), $"test-data-residency-{Guid.NewGuid()}.yaml");
        
        _testConfigContent = @"
version: ""1.0""
default_region: ""US""
regions:
  - code: ""US""
    name: ""United States""
    description: ""US region""
    countries:
      - ""US""
      - ""CA""
    database:
      host: ""us-db.example.com""
      port: 5432
      database: ""onboarding_us""
      ssl: true
    storage:
      endpoint: ""us-storage.example.com""
      bucket_prefix: ""us-""
      ssl: true
      region: ""us-east-1""
    kafka:
      bootstrap_servers: ""us-kafka.example.com:9092""
  - code: ""EU""
    name: ""Europe""
    description: ""EU region""
    countries:
      - ""GB""
      - ""FR""
      - ""DE""
    database:
      host: ""eu-db.example.com""
      port: 5432
      database: ""onboarding_eu""
      ssl: true
    storage:
      endpoint: ""eu-storage.example.com""
      bucket_prefix: ""eu-""
      ssl: true
      region: ""eu-west-1""
    kafka:
      bootstrap_servers: ""eu-kafka.example.com:9092""
retention_policies:
  documents: 1825
  audit_logs: 2555
audit:
  log_all_data_access: true
  log_cross_region_access: true
  alert_on_residency_violation: true
  compliance_team_email: ""compliance@example.com""
";
        File.WriteAllText(_testConfigPath, _testConfigContent);
    }

    public void Dispose()
    {
        if (File.Exists(_testConfigPath))
        {
            File.Delete(_testConfigPath);
        }
    }

    [Fact]
    public async Task GetRegionForCountryAsync_ShouldReturnCorrectRegion_WhenCountryExists()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRegionForCountryAsync("US");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("US", result.Code);
        Assert.Equal("United States", result.Name);
    }

    [Fact]
    public async Task GetRegionForCountryAsync_ShouldReturnDefaultRegion_WhenCountryNotFound()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRegionForCountryAsync("XX");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("US", result.Code); // Default region
    }

    [Fact]
    public async Task GetRegionForCountryAsync_ShouldBeCaseInsensitive()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRegionForCountryAsync("gb");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("EU", result.Code);
    }

    [Fact]
    public async Task GetDatabaseConnectionStringAsync_ShouldReturnConnectionString_WhenRegionExists()
    {
        // Arrange
        Environment.SetEnvironmentVariable("DB_US_USERNAME", "testuser");
        Environment.SetEnvironmentVariable("DB_US_PASSWORD", "testpass");
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetDatabaseConnectionStringAsync("US");

        // Assert
        Assert.NotNull(result);
        Assert.Contains("Host=us-db.example.com", result);
        Assert.Contains("Port=5432", result);
        Assert.Contains("Database=onboarding_us", result);
        Assert.Contains("SSL Mode=Require", result);
        Assert.Contains("Username=testuser", result);
        Assert.Contains("Password=testpass", result);
    }

    [Fact]
    public async Task GetDatabaseConnectionStringAsync_ShouldThrow_WhenRegionNotFound()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.GetDatabaseConnectionStringAsync("INVALID"));
    }

    [Fact]
    public async Task GetStorageConfigAsync_ShouldReturnStorageConfig_WhenRegionExists()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetStorageConfigAsync("EU");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("eu-storage.example.com", result.Endpoint);
        Assert.Equal("eu-", result.BucketPrefix);
        Assert.True(result.Ssl);
        Assert.Equal("eu-west-1", result.Region);
    }

    [Fact]
    public async Task GetStorageConfigAsync_ShouldThrow_WhenRegionNotFound()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.GetStorageConfigAsync("INVALID"));
    }

    [Fact]
    public async Task GetKafkaConfigAsync_ShouldReturnKafkaConfig_WhenRegionExists()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetKafkaConfigAsync("US");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("us-kafka.example.com:9092", result.BootstrapServers);
    }

    [Fact]
    public async Task GetKafkaConfigAsync_ShouldThrow_WhenRegionNotFound()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.GetKafkaConfigAsync("INVALID"));
    }

    [Fact]
    public async Task ValidateDataResidencyAsync_ShouldReturnValid_WhenRegionMatches()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.ValidateDataResidencyAsync("US", "US");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Equal("US", result.ExpectedRegion);
        Assert.Equal("US", result.ActualRegion);
        Assert.Null(result.ViolationReason);
    }

    [Fact]
    public async Task ValidateDataResidencyAsync_ShouldReturnInvalid_WhenRegionMismatches()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.ValidateDataResidencyAsync("US", "EU");

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsValid);
        Assert.Equal("US", result.ExpectedRegion);
        Assert.Equal("EU", result.ActualRegion);
        Assert.NotNull(result.ViolationReason);
        Assert.Contains("US", result.ViolationReason);
    }

    [Fact]
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnConfiguredValue_WhenDataTypeExists()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRetentionPeriodDaysAsync("documents");

        // Assert
        Assert.Equal(1825, result);
    }

    [Fact]
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnDefault_WhenDataTypeNotFound()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRetentionPeriodDaysAsync("unknown");

        // Assert
        Assert.Equal(1825, result); // Default 5 years
    }
}

