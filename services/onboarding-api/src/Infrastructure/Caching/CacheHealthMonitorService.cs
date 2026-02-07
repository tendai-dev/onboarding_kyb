using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Caching;

/// <summary>
/// Background service that periodically checks cache health and logs warnings/alerts.
/// </summary>
public class CacheHealthMonitorService : BackgroundService
{
    private readonly ICacheMetrics _metrics;
    private readonly ILogger<CacheHealthMonitorService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

    public CacheHealthMonitorService(
        ICacheMetrics metrics,
        ILogger<CacheHealthMonitorService> logger)
    {
        _metrics = metrics;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Cache health monitor started. Check interval: {Interval}", _checkInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var report = _metrics.GetHealthReport();
                LogHealthReport(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking cache health");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Cache health monitor stopped");
    }

    private void LogHealthReport(CacheHealthReport report)
    {
        foreach (var cacheType in report.CacheTypes)
        {
            switch (cacheType.Status)
            {
                case CacheHealthStatus.Critical:
                    _logger.LogError(
                        "CACHE CRITICAL: {CacheType} - Hit Rate: {HitRate:P2}, Hits: {Hits}, Misses: {Misses}, Errors: {Errors}. " +
                        "Database is likely being hammered. Investigate immediately!",
                        cacheType.CacheType, cacheType.HitRate, cacheType.Hits, cacheType.Misses, cacheType.Errors);
                    break;

                case CacheHealthStatus.Degraded:
                    _logger.LogWarning(
                        "CACHE DEGRADED: {CacheType} - Hit Rate: {HitRate:P2}, Hits: {Hits}, Misses: {Misses}, Errors: {Errors}. " +
                        "Performance may be impacted.",
                        cacheType.CacheType, cacheType.HitRate, cacheType.Hits, cacheType.Misses, cacheType.Errors);
                    break;

                case CacheHealthStatus.Healthy:
                    if (cacheType.TotalRequests > 0)
                    {
                        _logger.LogDebug(
                            "Cache healthy: {CacheType} - Hit Rate: {HitRate:P2}, Total: {Total}",
                            cacheType.CacheType, cacheType.HitRate, cacheType.TotalRequests);
                    }
                    break;
            }
        }

        if (report.OverallStatus == CacheHealthStatus.Critical)
        {
            _logger.LogError(
                "OVERALL CACHE STATUS: CRITICAL - Multiple cache types are failing. " +
                "Application performance severely degraded.");
        }
    }
}
