using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.Logging;

/// <summary>
/// Performance metrics per operation for production debugging.
/// Tracks duration, success/failure, and operation-specific metadata.
/// </summary>
public interface IOperationMetrics
{
    IDisposable BeginOperation(string operationName, string? entityType = null, string? entityId = null);
    void RecordSuccess(string operationName, long durationMs);
    void RecordFailure(string operationName, long durationMs, string errorType);
}

public class OperationMetrics : IOperationMetrics
{
    private readonly ILogger<OperationMetrics> _logger;
    
    private static readonly Meter Meter = new("OnboardingApi.Operations", "1.0");
    private static readonly Histogram<double> OperationDuration = Meter.CreateHistogram<double>(
        "operation_duration_ms", "ms", "Duration of operations in milliseconds");
    private static readonly Counter<long> OperationSuccess = Meter.CreateCounter<long>(
        "operation_success_total", "count", "Total successful operations");
    private static readonly Counter<long> OperationFailure = Meter.CreateCounter<long>(
        "operation_failure_total", "count", "Total failed operations");

    public OperationMetrics(ILogger<OperationMetrics> logger)
    {
        _logger = logger;
    }

    public IDisposable BeginOperation(string operationName, string? entityType = null, string? entityId = null)
    {
        return new OperationScope(this, _logger, operationName, entityType, entityId);
    }

    public void RecordSuccess(string operationName, long durationMs)
    {
        OperationDuration.Record(durationMs, new KeyValuePair<string, object?>("operation", operationName));
        OperationSuccess.Add(1, new KeyValuePair<string, object?>("operation", operationName));
    }

    public void RecordFailure(string operationName, long durationMs, string errorType)
    {
        OperationDuration.Record(durationMs, new KeyValuePair<string, object?>("operation", operationName));
        OperationFailure.Add(1, 
            new KeyValuePair<string, object?>("operation", operationName),
            new KeyValuePair<string, object?>("error_type", errorType));
    }

    private class OperationScope : IDisposable
    {
        private readonly OperationMetrics _metrics;
        private readonly ILogger _logger;
        private readonly string _operationName;
        private readonly string? _entityType;
        private readonly string? _entityId;
        private readonly Stopwatch _stopwatch;
        private bool _completed;

        public OperationScope(OperationMetrics metrics, ILogger logger, string operationName, 
            string? entityType, string? entityId)
        {
            _metrics = metrics;
            _logger = logger;
            _operationName = operationName;
            _entityType = entityType;
            _entityId = entityId;
            _stopwatch = Stopwatch.StartNew();

            _logger.LogDebug("OPERATION_START | {Operation} | Entity: {EntityType}:{EntityId}",
                operationName, entityType ?? "-", entityId ?? "-");
        }

        public void Dispose()
        {
            if (_completed) return;
            _completed = true;
            _stopwatch.Stop();

            var durationMs = _stopwatch.ElapsedMilliseconds;
            _metrics.RecordSuccess(_operationName, durationMs);

            var level = durationMs > 1000 ? LogLevel.Warning : LogLevel.Debug;
            _logger.Log(level, 
                "OPERATION_END | {Operation} | Entity: {EntityType}:{EntityId} | Duration: {Duration}ms",
                _operationName, _entityType ?? "-", _entityId ?? "-", durationMs);
        }
    }
}

/// <summary>
/// Extension methods for common operation tracking patterns.
/// </summary>
public static class OperationMetricsExtensions
{
    public static async Task<T> TrackAsync<T>(this IOperationMetrics metrics, 
        string operationName, Func<Task<T>> operation, string? entityType = null, string? entityId = null)
    {
        using var scope = metrics.BeginOperation(operationName, entityType, entityId);
        return await operation();
    }

    public static async Task TrackAsync(this IOperationMetrics metrics,
        string operationName, Func<Task> operation, string? entityType = null, string? entityId = null)
    {
        using var scope = metrics.BeginOperation(operationName, entityType, entityId);
        await operation();
    }
}
