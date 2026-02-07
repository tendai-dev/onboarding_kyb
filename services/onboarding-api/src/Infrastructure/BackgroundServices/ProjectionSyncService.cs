using System.Collections.Concurrent;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace OnboardingApi.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that handles projection sync with retry logic.
/// Replaces fire-and-forget HTTP calls with a proper queue-based approach.
/// </summary>
public class ProjectionSyncService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ProjectionSyncService> _logger;
    
    private static readonly ConcurrentQueue<SyncRequest> _syncQueue = new();
    private readonly TimeSpan _processingInterval = TimeSpan.FromSeconds(2);
    private const int MaxRetries = 3;
    private static readonly TimeSpan[] RetryDelays = { 
        TimeSpan.FromSeconds(1), 
        TimeSpan.FromSeconds(5), 
        TimeSpan.FromSeconds(15) 
    };

    public ProjectionSyncService(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ProjectionSyncService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Queue a case for projection sync. Thread-safe.
    /// </summary>
    public static void QueueSync(Guid caseId, string? caseNumber = null)
    {
        _syncQueue.Enqueue(new SyncRequest(caseId, caseNumber, 0, DateTime.UtcNow));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ProjectionSyncService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessQueueAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing projection sync queue");
            }

            await Task.Delay(_processingInterval, stoppingToken);
        }

        _logger.LogInformation("ProjectionSyncService stopped");
    }

    private async Task ProcessQueueAsync(CancellationToken cancellationToken)
    {
        var processedCount = 0;
        var requeueList = new List<SyncRequest>();

        while (_syncQueue.TryDequeue(out var request) && processedCount < 10)
        {
            // Check if we should wait before retrying
            if (request.RetryCount > 0)
            {
                var delay = RetryDelays[Math.Min(request.RetryCount - 1, RetryDelays.Length - 1)];
                var waitUntil = request.LastAttempt.Add(delay);
                if (DateTime.UtcNow < waitUntil)
                {
                    requeueList.Add(request);
                    continue;
                }
            }

            var success = await TrySyncCaseAsync(request, cancellationToken);
            
            if (!success && request.RetryCount < MaxRetries)
            {
                // Requeue with incremented retry count
                requeueList.Add(request with { 
                    RetryCount = request.RetryCount + 1, 
                    LastAttempt = DateTime.UtcNow 
                });
                _logger.LogWarning("Projection sync for case {CaseId} failed, will retry ({RetryCount}/{MaxRetries})",
                    request.CaseId, request.RetryCount + 1, MaxRetries);
            }
            else if (!success)
            {
                _logger.LogError("Projection sync for case {CaseId} failed after {MaxRetries} retries. Manual sync required.",
                    request.CaseId, MaxRetries);
            }

            processedCount++;
        }

        // Requeue items that need retry
        foreach (var item in requeueList)
        {
            _syncQueue.Enqueue(item);
        }
    }

    private async Task<bool> TrySyncCaseAsync(SyncRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var projectionsBase = _configuration["Services:Projections:BaseUrl"]?.TrimEnd('/') 
                ?? _configuration["ASPNETCORE_URLS"]?.Split(';').FirstOrDefault()?.TrimEnd('/')
                ?? "http://localhost:8001";

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            var syncUrl = $"{projectionsBase}/api/v1/sync?forceFullSync=false";
            _logger.LogDebug("Syncing projections for case {CaseId} at {Url} (attempt {Attempt})", 
                request.CaseId, syncUrl, request.RetryCount + 1);

            var response = await client.PostAsync(syncUrl, null, cancellationToken);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Projections sync endpoint not found at {Url}", syncUrl);
                return true; // Don't retry if endpoint doesn't exist
            }

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken: cancellationToken);
                var casesCreated = result.TryGetProperty("casesCreated", out var created) ? created.GetInt32() : 0;
                var casesUpdated = result.TryGetProperty("casesUpdated", out var updated) ? updated.GetInt32() : 0;
                
                _logger.LogInformation("Projection sync completed for case {CaseId}. Created: {Created}, Updated: {Updated}", 
                    request.CaseId, casesCreated, casesUpdated);

                // If incremental sync didn't find the case, try force sync
                if (casesCreated == 0 && casesUpdated == 0)
                {
                    var forceSyncUrl = $"{projectionsBase}/api/v1/sync?forceFullSync=true";
                    var forceResponse = await client.PostAsync(forceSyncUrl, null, cancellationToken);
                    if (forceResponse.IsSuccessStatusCode)
                    {
                        var forceResult = await forceResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken: cancellationToken);
                        var forceCreated = forceResult.TryGetProperty("casesCreated", out var fc) ? fc.GetInt32() : 0;
                        var forceUpdated = forceResult.TryGetProperty("casesUpdated", out var fu) ? fu.GetInt32() : 0;
                        _logger.LogInformation("Force sync completed for case {CaseId}. Created: {Created}, Updated: {Updated}", 
                            request.CaseId, forceCreated, forceUpdated);
                    }
                }

                return true;
            }

            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Projection sync returned {Status} for case {CaseId}: {Error}", 
                (int)response.StatusCode, request.CaseId, errorContent);
            return false;
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Projection sync timed out for case {CaseId}", request.CaseId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Projection sync failed for case {CaseId}: {Error}", request.CaseId, ex.Message);
            return false;
        }
    }

    private record SyncRequest(Guid CaseId, string? CaseNumber, int RetryCount, DateTime LastAttempt);
}
