using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Caching;

/// <summary>
/// Wrapper around IDistributedCache that adds metrics tracking and graceful fallback.
/// Monitors cache hits, misses, and errors for health monitoring.
/// </summary>
public class MonitoredDistributedCache : IDistributedCache
{
    private readonly IDistributedCache _innerCache;
    private readonly ICacheMetrics _metrics;
    private readonly ILogger<MonitoredDistributedCache> _logger;
    private readonly string _cacheType;

    public MonitoredDistributedCache(
        IDistributedCache innerCache,
        ICacheMetrics metrics,
        ILogger<MonitoredDistributedCache> logger,
        string cacheType = "distributed")
    {
        _innerCache = innerCache;
        _metrics = metrics;
        _logger = logger;
        _cacheType = cacheType;
    }

    public byte[]? Get(string key)
    {
        try
        {
            var result = _innerCache.Get(key);
            RecordResult(result != null);
            return result;
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "Get", key);
            return null; // Graceful fallback
        }
    }

    public async Task<byte[]?> GetAsync(string key, CancellationToken token = default)
    {
        try
        {
            var result = await _innerCache.GetAsync(key, token);
            RecordResult(result != null);
            return result;
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "GetAsync", key);
            return null; // Graceful fallback
        }
    }

    public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
    {
        try
        {
            _innerCache.Set(key, value, options);
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "Set", key);
            // Don't throw - graceful degradation
        }
    }

    public async Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        try
        {
            await _innerCache.SetAsync(key, value, options, token);
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "SetAsync", key);
            // Don't throw - graceful degradation
        }
    }

    public void Refresh(string key)
    {
        try
        {
            _innerCache.Refresh(key);
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "Refresh", key);
        }
    }

    public async Task RefreshAsync(string key, CancellationToken token = default)
    {
        try
        {
            await _innerCache.RefreshAsync(key, token);
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "RefreshAsync", key);
        }
    }

    public void Remove(string key)
    {
        try
        {
            _innerCache.Remove(key);
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "Remove", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken token = default)
    {
        try
        {
            await _innerCache.RemoveAsync(key, token);
        }
        catch (Exception ex)
        {
            HandleCacheError(ex, "RemoveAsync", key);
        }
    }

    private void RecordResult(bool isHit)
    {
        if (isHit)
            _metrics.RecordHit(_cacheType);
        else
            _metrics.RecordMiss(_cacheType);
    }

    private void HandleCacheError(Exception ex, string operation, string key)
    {
        var errorType = ex switch
        {
            TimeoutException => "timeout",
            OperationCanceledException => "cancelled",
            _ when ex.Message.Contains("connection", StringComparison.OrdinalIgnoreCase) => "connection",
            _ => "unknown"
        };

        _metrics.RecordError(_cacheType, errorType);
        
        _logger.LogWarning(ex,
            "Cache {Operation} failed for key {Key}. Falling back to database. Error: {Error}",
            operation, key, ex.Message);
    }
}

/// <summary>
/// Extension methods for cache string operations with monitoring
/// </summary>
public static class MonitoredCacheExtensions
{
    public static async Task<string?> GetStringWithMetricsAsync(
        this IDistributedCache cache,
        string key,
        ICacheMetrics metrics,
        string cacheType,
        CancellationToken token = default)
    {
        var bytes = await cache.GetAsync(key, token);
        
        if (bytes == null)
        {
            metrics.RecordMiss(cacheType);
            return null;
        }
        
        metrics.RecordHit(cacheType);
        return System.Text.Encoding.UTF8.GetString(bytes);
    }

    public static async Task SetStringWithMetricsAsync(
        this IDistributedCache cache,
        string key,
        string value,
        DistributedCacheEntryOptions options,
        CancellationToken token = default)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(value);
        await cache.SetAsync(key, bytes, options, token);
    }
}
