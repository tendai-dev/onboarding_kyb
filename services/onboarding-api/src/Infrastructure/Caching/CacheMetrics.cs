using System.Collections.Concurrent;
using System.Diagnostics.Metrics;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Caching;

/// <summary>
/// Tracks cache metrics including hits, misses, and hit rate.
/// Provides monitoring and alerting for cache health.
/// </summary>
public interface ICacheMetrics
{
    void RecordHit(string cacheType);
    void RecordMiss(string cacheType);
    void RecordError(string cacheType, string errorType);
    CacheHealthReport GetHealthReport();
    double GetHitRate(string cacheType);
}

public class CacheMetrics : ICacheMetrics
{
    private readonly ILogger<CacheMetrics> _logger;
    private readonly ConcurrentDictionary<string, CacheTypeMetrics> _metrics = new();
    
    // OpenTelemetry metrics
    private static readonly Meter Meter = new("OnboardingApi.Cache", "1.0");
    private static readonly Counter<long> HitCounter = Meter.CreateCounter<long>("cache_hits_total", "count", "Total cache hits");
    private static readonly Counter<long> MissCounter = Meter.CreateCounter<long>("cache_misses_total", "count", "Total cache misses");
    private static readonly Counter<long> ErrorCounter = Meter.CreateCounter<long>("cache_errors_total", "count", "Total cache errors");
    private static readonly ObservableGauge<double> HitRateGauge;

    private const double HIT_RATE_THRESHOLD = 0.7; // 70% minimum acceptable hit rate
    private const double CRITICAL_HIT_RATE_THRESHOLD = 0.5; // 50% critical threshold

    static CacheMetrics()
    {
        // This would need instance access, so we'll use a different approach
    }

    public CacheMetrics(ILogger<CacheMetrics> logger)
    {
        _logger = logger;
    }

    public void RecordHit(string cacheType)
    {
        var metrics = GetOrCreateMetrics(cacheType);
        Interlocked.Increment(ref metrics.Hits);
        Interlocked.Increment(ref metrics.TotalRequests);
        
        HitCounter.Add(1, new KeyValuePair<string, object?>("cache_type", cacheType));
    }

    public void RecordMiss(string cacheType)
    {
        var metrics = GetOrCreateMetrics(cacheType);
        Interlocked.Increment(ref metrics.Misses);
        Interlocked.Increment(ref metrics.TotalRequests);
        
        MissCounter.Add(1, new KeyValuePair<string, object?>("cache_type", cacheType));
        
        // Check hit rate and log warning if below threshold
        CheckHitRateThreshold(cacheType, metrics);
    }

    public void RecordError(string cacheType, string errorType)
    {
        var metrics = GetOrCreateMetrics(cacheType);
        Interlocked.Increment(ref metrics.Errors);
        
        ErrorCounter.Add(1, 
            new KeyValuePair<string, object?>("cache_type", cacheType),
            new KeyValuePair<string, object?>("error_type", errorType));
        
        _logger.LogWarning("Cache error recorded for {CacheType}: {ErrorType}", cacheType, errorType);
    }

    public double GetHitRate(string cacheType)
    {
        if (!_metrics.TryGetValue(cacheType, out var metrics))
            return 1.0; // No data yet, assume healthy
        
        var total = Interlocked.Read(ref metrics.TotalRequests);
        if (total == 0)
            return 1.0;
        
        var hits = Interlocked.Read(ref metrics.Hits);
        return (double)hits / total;
    }

    public CacheHealthReport GetHealthReport()
    {
        var report = new CacheHealthReport
        {
            GeneratedAt = DateTime.UtcNow,
            CacheTypes = new List<CacheTypeReport>()
        };

        foreach (var kvp in _metrics)
        {
            var metrics = kvp.Value;
            var hits = Interlocked.Read(ref metrics.Hits);
            var misses = Interlocked.Read(ref metrics.Misses);
            var errors = Interlocked.Read(ref metrics.Errors);
            var total = Interlocked.Read(ref metrics.TotalRequests);
            var hitRate = total > 0 ? (double)hits / total : 1.0;

            var typeReport = new CacheTypeReport
            {
                CacheType = kvp.Key,
                Hits = hits,
                Misses = misses,
                Errors = errors,
                TotalRequests = total,
                HitRate = hitRate,
                Status = GetHealthStatus(hitRate, errors)
            };

            report.CacheTypes.Add(typeReport);
        }

        report.OverallStatus = report.CacheTypes.Count == 0 
            ? CacheHealthStatus.Healthy 
            : report.CacheTypes.Max(c => c.Status);

        return report;
    }

    private CacheTypeMetrics GetOrCreateMetrics(string cacheType)
    {
        return _metrics.GetOrAdd(cacheType, _ => new CacheTypeMetrics());
    }

    private void CheckHitRateThreshold(string cacheType, CacheTypeMetrics metrics)
    {
        var total = Interlocked.Read(ref metrics.TotalRequests);
        
        // Only check after sufficient samples (at least 100 requests)
        if (total < 100)
            return;
        
        // Check every 100 requests to avoid excessive logging
        if (total % 100 != 0)
            return;

        var hitRate = GetHitRate(cacheType);

        if (hitRate < CRITICAL_HIT_RATE_THRESHOLD)
        {
            _logger.LogError(
                "CRITICAL: Cache hit rate for {CacheType} is {HitRate:P2}, below critical threshold {Threshold:P0}. " +
                "Database may be under heavy load. Hits: {Hits}, Misses: {Misses}",
                cacheType, hitRate, CRITICAL_HIT_RATE_THRESHOLD,
                Interlocked.Read(ref metrics.Hits), Interlocked.Read(ref metrics.Misses));
        }
        else if (hitRate < HIT_RATE_THRESHOLD)
        {
            _logger.LogWarning(
                "Cache hit rate for {CacheType} is {HitRate:P2}, below threshold {Threshold:P0}. " +
                "Consider investigating cache configuration. Hits: {Hits}, Misses: {Misses}",
                cacheType, hitRate, HIT_RATE_THRESHOLD,
                Interlocked.Read(ref metrics.Hits), Interlocked.Read(ref metrics.Misses));
        }
    }

    private static CacheHealthStatus GetHealthStatus(double hitRate, long errors)
    {
        if (errors > 10 || hitRate < CRITICAL_HIT_RATE_THRESHOLD)
            return CacheHealthStatus.Critical;
        
        if (errors > 0 || hitRate < HIT_RATE_THRESHOLD)
            return CacheHealthStatus.Degraded;
        
        return CacheHealthStatus.Healthy;
    }

    private class CacheTypeMetrics
    {
        public long Hits;
        public long Misses;
        public long Errors;
        public long TotalRequests;
    }
}

public class CacheHealthReport
{
    public DateTime GeneratedAt { get; set; }
    public CacheHealthStatus OverallStatus { get; set; }
    public List<CacheTypeReport> CacheTypes { get; set; } = new();
}

public class CacheTypeReport
{
    public string CacheType { get; set; } = string.Empty;
    public long Hits { get; set; }
    public long Misses { get; set; }
    public long Errors { get; set; }
    public long TotalRequests { get; set; }
    public double HitRate { get; set; }
    public CacheHealthStatus Status { get; set; }
}

public enum CacheHealthStatus
{
    Healthy = 0,
    Degraded = 1,
    Critical = 2
}
