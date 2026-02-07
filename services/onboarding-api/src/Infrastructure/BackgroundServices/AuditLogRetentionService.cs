using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OnboardingApi.Infrastructure.Persistence.Audit;

namespace OnboardingApi.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that manages audit log retention policy.
/// - Enforces 7-year retention period (regulatory compliance)
/// - Auto-creates partitions for upcoming years
/// - Drops old partitions after retention period
/// - Runs monthly to minimize overhead
/// </summary>
public class AuditLogRetentionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogRetentionService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromDays(30); // Monthly
    private readonly int _retentionYears = 7; // Regulatory requirement

    public AuditLogRetentionService(
        IServiceScopeFactory scopeFactory,
        ILogger<AuditLogRetentionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Audit log retention service started. Retention period: {Years} years, Check interval: {Interval} days",
            _retentionYears, _checkInterval.TotalDays);

        // Initial delay to let the application start up
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ManagePartitionsAsync(stoppingToken);
                await EnforceRetentionPolicyAsync(stoppingToken);
                await LogPartitionStatsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in audit log retention service");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Audit log retention service stopped");
    }

    /// <summary>
    /// Creates partitions for upcoming years to ensure smooth operation.
    /// </summary>
    private async Task ManagePartitionsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditLogDbContext>();

        var currentYear = DateTime.UtcNow.Year;
        
        // Ensure partitions exist for current year + 2 years ahead
        for (var year = currentYear; year <= currentYear + 2; year++)
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(
                    "SELECT audit.create_audit_partition(@p0)",
                    new object[] { year },
                    cancellationToken);
                
                _logger.LogDebug("Ensured partition exists for year {Year}", year);
            }
            catch (Exception ex)
            {
                // Partition might already exist or function might not exist yet
                _logger.LogDebug(ex, "Could not create partition for year {Year}", year);
            }
        }
    }

    /// <summary>
    /// Drops partitions older than the retention period.
    /// </summary>
    private async Task EnforceRetentionPolicyAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditLogDbContext>();

        var cutoffYear = DateTime.UtcNow.Year - _retentionYears;
        
        _logger.LogInformation(
            "Enforcing retention policy. Cutoff year: {CutoffYear} (records before {CutoffDate} will be removed)",
            cutoffYear, new DateTime(cutoffYear, 1, 1));

        // Find and drop old partitions
        var oldPartitions = await context.Database
            .SqlQueryRaw<string>(@"
                SELECT tablename::text 
                FROM pg_tables 
                WHERE schemaname = 'audit' 
                AND tablename LIKE 'audit_log_entries_%'
                AND tablename ~ '^audit_log_entries_[0-9]{4}$'
                AND SUBSTRING(tablename FROM '[0-9]{4}')::INTEGER < @p0",
                cutoffYear)
            .ToListAsync(cancellationToken);

        foreach (var partition in oldPartitions)
        {
            try
            {
                // Get record count before dropping
                var countResult = await context.Database
                    .SqlQueryRaw<long>($"SELECT COUNT(*)::bigint FROM audit.{partition}")
                    .FirstOrDefaultAsync(cancellationToken);

                _logger.LogWarning(
                    "Dropping old audit partition {Partition} with {Count} records (retention policy: {Years} years)",
                    partition, countResult, _retentionYears);

                await context.Database.ExecuteSqlRawAsync(
                    $"DROP TABLE IF EXISTS audit.{partition}",
                    cancellationToken);

                _logger.LogInformation("Successfully dropped partition {Partition}", partition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to drop partition {Partition}", partition);
            }
        }
    }

    /// <summary>
    /// Logs statistics about current partitions for monitoring.
    /// </summary>
    private async Task LogPartitionStatsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditLogDbContext>();

        try
        {
            var stats = await context.Database
                .SqlQueryRaw<PartitionStats>(@"
                    SELECT 
                        c.relname::text as partition_name,
                        pg_size_pretty(pg_total_relation_size(c.oid))::text as size,
                        COALESCE(s.n_live_tup, 0)::bigint as row_count
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
                    WHERE n.nspname = 'audit'
                    AND c.relname LIKE 'audit_log_entries_%'
                    AND c.relkind = 'r'
                    ORDER BY c.relname")
                .ToListAsync(cancellationToken);

            var totalRows = stats.Sum(s => s.RowCount);
            
            _logger.LogInformation(
                "Audit log partition stats: {PartitionCount} partitions, {TotalRows:N0} total records",
                stats.Count, totalRows);

            foreach (var stat in stats)
            {
                _logger.LogDebug(
                    "  Partition {Name}: {Size}, {Rows:N0} rows",
                    stat.PartitionName, stat.Size, stat.RowCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not retrieve partition stats (partitioning may not be enabled yet)");
        }
    }

    private class PartitionStats
    {
        public string PartitionName { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public long RowCount { get; set; }
    }
}
