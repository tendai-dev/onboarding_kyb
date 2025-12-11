using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.DataResidency;
using OnboardingApi.Tests.Unit.TestHelpers;
using System.IO;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.DataResidency;

public class DataResidencyServiceEdgeCaseTests
{
    [Fact]
    public async Task GetRegionForCountryAsync_ShouldUseDefaultRegion_WhenCountryNotFound()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
default_region: ZA
retention_policies: {}
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act
            var result = await service.GetRegionForCountryAsync("XX"); // Non-existent country

            // Assert
            Assert.Equal("ZA", result.Code);
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task GetDatabaseConnectionStringAsync_ShouldThrow_WhenRegionNotFound()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
    database:
      host: localhost
      port: 5432
      database: testdb
      ssl: false
default_region: ZA
retention_policies: {}
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => 
                service.GetDatabaseConnectionStringAsync("INVALID"));
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task GetStorageConfigAsync_ShouldThrow_WhenRegionNotFound()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
    database:
      host: localhost
      port: 5432
      database: testdb
      ssl: false
    storage:
      endpoint: http://localhost:9000
      bucket_prefix: test-
      ssl: false
      region: test-region
    kafka:
      bootstrap_servers: localhost:9092
default_region: ZA
retention_policies: {}
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => 
                service.GetStorageConfigAsync("INVALID"));
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task GetKafkaConfigAsync_ShouldThrow_WhenRegionNotFound()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
    database:
      host: localhost
      port: 5432
      database: testdb
      ssl: false
    storage:
      endpoint: http://localhost:9000
      bucket_prefix: test-
      ssl: false
      region: test-region
    kafka:
      bootstrap_servers: localhost:9092
default_region: ZA
retention_policies: {}
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => 
                service.GetKafkaConfigAsync("INVALID"));
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task ValidateDataResidencyAsync_ShouldReturnValid_WhenRegionsMatch()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
default_region: ZA
retention_policies: {}
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act
            var result = await service.ValidateDataResidencyAsync("ZA", "ZA");

            // Assert
            Assert.True(result.IsValid);
            Assert.Equal("ZA", result.ExpectedRegion);
            Assert.Equal("ZA", result.ActualRegion);
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task ValidateDataResidencyAsync_ShouldReturnInvalid_WhenRegionsMismatch()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
    database:
      host: localhost
      port: 5432
      database: testdb
      ssl: false
    storage:
      endpoint: http://localhost:9000
      bucket_prefix: test-
      ssl: false
      region: test-region
    kafka:
      bootstrap_servers: localhost:9092
  - code: US
    name: United States
    countries: [US]
    database:
      host: localhost
      port: 5432
      database: testdb
      ssl: false
    storage:
      endpoint: http://localhost:9000
      bucket_prefix: test-
      ssl: false
      region: test-region
    kafka:
      bootstrap_servers: localhost:9092
default_region: ZA
retention_policies: {}
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act
            var result = await service.ValidateDataResidencyAsync("ZA", "US");

            // Assert
            Assert.False(result.IsValid);
            Assert.Equal("ZA", result.ExpectedRegion);
            Assert.Equal("US", result.ActualRegion);
            Assert.NotNull(result.ViolationReason);
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnDefault_WhenDataTypeNotFound()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
default_region: ZA
retention_policies:
  documents: 365
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act
            var result = await service.GetRetentionPeriodDaysAsync("UnknownType");

            // Assert
            Assert.Equal(1825, result); // Default 5 years
        }
        finally
        {
            File.Delete(configPath);
        }
    }

    [Fact]
    public async Task GetRetentionPeriodDaysAsync_ShouldReturnConfiguredValue_WhenDataTypeFound()
    {
        // Arrange
        var configPath = Path.Combine(Path.GetTempPath(), $"test-config-{Guid.NewGuid()}.yaml");
        var yaml = @"
version: '1.0'
regions:
  - code: ZA
    name: South Africa
    countries: [ZA]
default_region: ZA
retention_policies:
  documents: 365
  audit_logs: 2555
pii_fields: []
audit:
  log_all_data_access: false
  log_cross_region_access: false
  alert_on_residency_violation: false
  compliance_team_email: ''
";
        File.WriteAllText(configPath, yaml);

        try
        {
            var logger = new MockLogger<DataResidencyService>();
            var service = new DataResidencyService(logger, configPath);

            // Act
            var result = await service.GetRetentionPeriodDaysAsync("documents");

            // Assert
            Assert.Equal(365, result);
        }
        finally
        {
            File.Delete(configPath);
        }
    }
}

