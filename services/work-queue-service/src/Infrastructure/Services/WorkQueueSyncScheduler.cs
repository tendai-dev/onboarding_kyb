using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using WorkQueueService.Infrastructure.Resilience;
using Polly;

namespace WorkQueueService.Infrastructure.Services;

/// <summary>
/// Background service that automatically syncs work items from onboarding cases
/// Runs daily at a configured time (default: 2 AM)
/// </summary>
public class WorkQueueSyncScheduler : BackgroundService
{
    private readonly ILogger<WorkQueueSyncScheduler> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly TimeSpan _syncInterval;
    private readonly TimeSpan _dailySyncTime;
    private readonly IAsyncPolicy<HttpResponseMessage> _resiliencePolicy;

    public WorkQueueSyncScheduler(
        ILogger<WorkQueueSyncScheduler> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        
        // Configure resilience policy for sync operations
        _resiliencePolicy = ResiliencePolicies.GetCombinedHttpPolicy("WorkQueueSync", logger, TimeSpan.FromMinutes(5));
        
        // Get sync interval from config - support both milliseconds and minutes
        // Priority: SyncIntervalMilliseconds > SyncIntervalMinutes
        var intervalMilliseconds = _configuration.GetValue<int?>("WorkQueue:SyncIntervalMilliseconds");
        if (intervalMilliseconds.HasValue && intervalMilliseconds.Value > 0)
        {
            // Use milliseconds if specified
            _syncInterval = TimeSpan.FromMilliseconds(intervalMilliseconds.Value);
            _logger.LogInformation(
                "WorkQueueSyncScheduler initialized - Sync interval: {Interval} milliseconds (continuous syncing enabled)",
                intervalMilliseconds.Value);
        }
        else
        {
            // Fall back to minutes (default: 5 minutes)
            var intervalMinutes = _configuration.GetValue<double>("WorkQueue:SyncIntervalMinutes", 5.0);
            _syncInterval = TimeSpan.FromMinutes(intervalMinutes);
            _logger.LogInformation(
                "WorkQueueSyncScheduler initialized - Sync interval: {Interval} minutes (continuous syncing enabled)",
                intervalMinutes);
        }
        
        // Daily sync time not needed for continuous syncing, but kept for backward compatibility
        var syncHour = _configuration.GetValue<int>("WorkQueue:DailySyncHour", 2);
        var syncMinute = _configuration.GetValue<int>("WorkQueue:DailySyncMinute", 0);
        _dailySyncTime = new TimeSpan(syncHour, syncMinute, 0);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WorkQueueSyncScheduler starting... (continuous sync mode)");
        
        // Wait for HTTP server to be ready
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        
        // Perform initial sync immediately
        _logger.LogInformation("Performing initial sync...");
        await PerformSyncAsync(stoppingToken);
        
        // Then sync at regular intervals continuously
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_syncInterval, stoppingToken);
                await PerformSyncAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("WorkQueueSyncScheduler is stopping...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in WorkQueueSyncScheduler sync cycle");
                // Wait a bit before retrying (use configured interval or 1 second minimum)
                var retryDelay = _syncInterval.TotalMilliseconds > 1000 
                    ? _syncInterval 
                    : TimeSpan.FromSeconds(1);
                await Task.Delay(retryDelay, stoppingToken);
            }
        }
        
        _logger.LogInformation("WorkQueueSyncScheduler stopped");
    }

    private DateTime GetNextSyncTime(DateTime now)
    {
        var todaySync = now.Date.Add(_dailySyncTime);
        
        // If today's sync time has passed, schedule for tomorrow
        if (todaySync <= now)
        {
            return todaySync.AddDays(1);
        }
        
        return todaySync;
    }

    private async Task PerformSyncAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Only log if interval is > 1 second to avoid log spam
            if (_syncInterval.TotalSeconds >= 1)
            {
                _logger.LogInformation("Starting automatic work queue sync...");
            }
            
            // Get the work queue service URL (self-reference)
            var workQueueUrl = _configuration["WorkQueue:ServiceUrl"]
                ?? Environment.GetEnvironmentVariable("WORK_QUEUE_SERVICE_URL")
                ?? "http://localhost:8091";
            
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromMinutes(5); // Allow time for large syncs
            
            var syncUrl = $"{workQueueUrl}/api/v1/workqueue/sync-from-onboarding?forceRecreate=false";
            
            // Only log URL if interval is > 1 second to avoid log spam
            if (_syncInterval.TotalSeconds >= 1)
            {
                _logger.LogInformation("Calling sync endpoint: {Url}", syncUrl);
            }
            
            var response = await _resiliencePolicy.ExecuteAsync(async () =>
                await httpClient.PostAsync(syncUrl, null, cancellationToken));
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadAsStringAsync(cancellationToken);
                // Only log if interval is > 1 second to avoid log spam
                if (_syncInterval.TotalSeconds >= 1)
                {
                    _logger.LogInformation(
                        "Automatic work queue sync completed successfully. Result: {Result}",
                        result);
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "Automatic work queue sync failed. Status: {Status}, Response: {Response}",
                    response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to perform automatic work queue sync");
        }
    }
}

