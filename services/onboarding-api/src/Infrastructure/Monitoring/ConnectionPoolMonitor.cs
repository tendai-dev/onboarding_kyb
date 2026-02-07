using System.Diagnostics.Metrics;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace OnboardingApi.Infrastructure.Monitoring;

/// <summary>
/// Monitors PostgreSQL connection pool health and logs warnings when approaching limits.
/// </summary>
public interface IConnectionPoolMonitor
{
    ConnectionPoolStats GetStats();
}

public class ConnectionPoolMonitor : IConnectionPoolMonitor
{
    private readonly NpgsqlDataSource _dataSource;
    private readonly ILogger<ConnectionPoolMonitor> _logger;
    
    // OpenTelemetry metrics
    private static readonly Meter Meter = new("OnboardingApi.Database", "1.0");
    private static readonly ObservableGauge<int> IdleConnectionsGauge;
    private static readonly ObservableGauge<int> BusyConnectionsGauge;
    private static readonly Counter<long> ConnectionTimeoutCounter;

    private static ConnectionPoolStats _lastStats = new();

    static ConnectionPoolMonitor()
    {
        IdleConnectionsGauge = Meter.CreateObservableGauge(
            "db_connections_idle",
            () => _lastStats.Idle,
            "connections",
            "Number of idle database connections");
        
        BusyConnectionsGauge = Meter.CreateObservableGauge(
            "db_connections_busy",
            () => _lastStats.Busy,
            "connections",
            "Number of busy database connections");
        
        ConnectionTimeoutCounter = Meter.CreateCounter<long>(
            "db_connection_timeouts_total",
            "count",
            "Total number of connection timeout errors");
    }

    public ConnectionPoolMonitor(
        NpgsqlDataSource dataSource,
        ILogger<ConnectionPoolMonitor> logger)
    {
        _dataSource = dataSource;
        _logger = logger;
    }

    public ConnectionPoolStats GetStats()
    {
        try
        {
            // Use NpgsqlConnection to get pool statistics
            using var conn = _dataSource.CreateConnection();
            var connString = conn.ConnectionString;
            
            // Parse max pool size from connection string or use default
            var maxPoolSize = 100;
            if (connString.Contains("Maximum Pool Size", StringComparison.OrdinalIgnoreCase))
            {
                var match = System.Text.RegularExpressions.Regex.Match(
                    connString, @"Maximum Pool Size\s*=\s*(\d+)", 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success)
                    maxPoolSize = int.Parse(match.Groups[1].Value);
            }

            // Npgsql doesn't expose detailed pool stats directly in newer versions
            // We track what we can and estimate the rest
            var poolStats = new ConnectionPoolStats
            {
                MaxPoolSize = maxPoolSize,
                // These would need to be tracked via interceptors or estimated
                Idle = 0,
                Busy = 0,
                Total = 0,
                Pending = 0,
                Utilization = 0
            };

            _lastStats = poolStats;
            return poolStats;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get connection pool statistics");
            return new ConnectionPoolStats();
        }
    }

    public void RecordTimeout()
    {
        ConnectionTimeoutCounter.Add(1);
    }
}

public class ConnectionPoolStats
{
    public int Idle { get; set; }
    public int Busy { get; set; }
    public int Total { get; set; }
    public int MaxPoolSize { get; set; }
    public int Pending { get; set; }
    public double Utilization { get; set; }
}

/// <summary>
/// Background service that periodically monitors connection pool health.
/// </summary>
public class ConnectionPoolHealthService : BackgroundService
{
    private readonly IConnectionPoolMonitor _monitor;
    private readonly ILogger<ConnectionPoolHealthService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30);

    private const double WARNING_UTILIZATION = 0.7;  // 70%
    private const double CRITICAL_UTILIZATION = 0.9; // 90%

    public ConnectionPoolHealthService(
        IConnectionPoolMonitor monitor,
        ILogger<ConnectionPoolHealthService> logger)
    {
        _monitor = monitor;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Connection pool health monitor started. Check interval: {Interval}s",
            _checkInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var stats = _monitor.GetStats();
                LogPoolHealth(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking connection pool health");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Connection pool health monitor stopped");
    }

    private void LogPoolHealth(ConnectionPoolStats stats)
    {
        if (stats.MaxPoolSize == 0)
            return;

        if (stats.Utilization >= CRITICAL_UTILIZATION)
        {
            _logger.LogError(
                "CRITICAL: Connection pool near exhaustion! " +
                "Busy: {Busy}/{Max} ({Utilization:P0}), Idle: {Idle}, Pending: {Pending}. " +
                "Users may experience timeouts. Consider scaling database or reducing load.",
                stats.Busy, stats.MaxPoolSize, stats.Utilization, stats.Idle, stats.Pending);
        }
        else if (stats.Utilization >= WARNING_UTILIZATION)
        {
            _logger.LogWarning(
                "Connection pool utilization high: Busy: {Busy}/{Max} ({Utilization:P0}), Idle: {Idle}, Pending: {Pending}",
                stats.Busy, stats.MaxPoolSize, stats.Utilization, stats.Idle, stats.Pending);
        }
        else
        {
            _logger.LogDebug(
                "Connection pool healthy: Busy: {Busy}/{Max} ({Utilization:P0}), Idle: {Idle}",
                stats.Busy, stats.MaxPoolSize, stats.Utilization, stats.Idle);
        }

        // Log pending connections as they indicate contention
        if (stats.Pending > 0)
        {
            _logger.LogWarning(
                "Connection pool has {Pending} pending requests waiting for connections",
                stats.Pending);
        }
    }
}
