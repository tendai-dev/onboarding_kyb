using Serilog.Core;
using Serilog.Events;
using System.Collections.Concurrent;

namespace OnboardingApi.Infrastructure.Logging;

/// <summary>
/// Samples Debug (10%) and Verbose (5%) logs to reduce volume by ~75%.
/// </summary>
public class LogSamplingFilter(int debugPercent = 10, int verbosePercent = 5) : ILogEventFilter
{
    private readonly Random _random = new();

    public bool IsEnabled(LogEvent e) => e.Level switch
    {
        >= LogEventLevel.Information => true,
        LogEventLevel.Debug => _random.Next(100) < debugPercent,
        LogEventLevel.Verbose => _random.Next(100) < verbosePercent,
        _ => true
    };
}

/// <summary>
/// Excludes health check and metrics endpoint logs.
/// </summary>
public class HighFrequencyLogFilter : ILogEventFilter
{
    private static readonly string[] ExcludedPaths = ["/health", "/ready", "/live", "/metrics"];

    public bool IsEnabled(LogEvent e)
    {
        if (e.Level >= LogEventLevel.Warning) return true;
        if (!e.Properties.TryGetValue("RequestPath", out var p)) return true;
        var path = p.ToString().Trim('"');
        return !ExcludedPaths.Any(x => path.StartsWith(x, StringComparison.OrdinalIgnoreCase));
    }
}

/// <summary>
/// Rate limits repeated errors to 1 per 5 seconds to prevent log flooding.
/// </summary>
public class RateLimitedLogFilter(int intervalSeconds = 5) : ILogEventFilter
{
    private readonly ConcurrentDictionary<string, DateTime> _lastLog = new();

    public bool IsEnabled(LogEvent e)
    {
        if (e.Level < LogEventLevel.Error) return true;
        var key = e.MessageTemplate.Text;
        var now = DateTime.UtcNow;
        if (_lastLog.TryGetValue(key, out var last) && now - last < TimeSpan.FromSeconds(intervalSeconds))
            return false;
        _lastLog[key] = now;
        return true;
    }
}
