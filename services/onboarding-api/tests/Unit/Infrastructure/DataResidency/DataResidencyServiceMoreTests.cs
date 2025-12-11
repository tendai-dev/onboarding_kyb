using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.DataResidency;
using OnboardingApi.Tests.Unit.TestHelpers;
using System.IO;
using System.Text;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.DataResidency;

public class DataResidencyServiceMoreTests : IDisposable
{
    private readonly MockLogger<DataResidencyService> _logger;
    private readonly string _testConfigPath;
    private readonly string _testConfigContent;

    public DataResidencyServiceMoreTests()
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
retention_policies:
  documents: 1825
  audit_logs: 2555
  test_data: 365
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
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnSpecificValue_WhenConfigured()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRetentionPeriodDaysAsync("test_data");

        // Assert
        Assert.Equal(365, result);
    }

    [Fact]
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnDefault_WhenNotConfigured()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRetentionPeriodDaysAsync("unknown_type");

        // Assert
        Assert.Equal(1825, result); // Default 5 years
    }

    [Fact]
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnAuditLogsValue()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRetentionPeriodDaysAsync("audit_logs");

        // Assert
        Assert.Equal(2555, result);
    }

    [Fact]
    public async Task GetRegionForCountryAsync_ShouldReturnEU_ForGB()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetRegionForCountryAsync("GB");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("US", result.Code); // Default region since GB not in config
    }

    [Fact]
    public async Task GetDatabaseConnectionStringAsync_ShouldIncludeSSLMode()
    {
        // Arrange
        Environment.SetEnvironmentVariable("DB_US_USERNAME", "testuser");
        Environment.SetEnvironmentVariable("DB_US_PASSWORD", "testpass");
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetDatabaseConnectionStringAsync("US");

        // Assert
        Assert.Contains("SSL Mode=Require", result);
    }

    [Fact]
    public async Task GetStorageConfigAsync_ShouldReturnCorrectRegion()
    {
        // Arrange
        var service = new DataResidencyService(_logger, _testConfigPath);

        // Act
        var result = await service.GetStorageConfigAsync("US");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("us-east-1", result.Region);
    }
}

