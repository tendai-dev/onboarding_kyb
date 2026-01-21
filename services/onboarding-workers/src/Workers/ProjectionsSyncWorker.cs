using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace OnboardingWorkers.Workers;

/// <summary>
/// Background worker that periodically syncs onboarding cases to projections table
/// This ensures projections stay in sync even if automatic sync fails
/// Runs every 5 minutes by default
/// </summary>
public class ProjectionsSyncWorker : BackgroundService
{
    private readonly ILogger<ProjectionsSyncWorker> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly TimeSpan _syncInterval;

    public ProjectionsSyncWorker(
        ILogger<ProjectionsSyncWorker> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        
        // Run every 5 minutes by default, or use configured interval
        var intervalMinutes = int.Parse(
            configuration["ProjectionsSync:IntervalMinutes"] 
            ?? configuration["PROJECTIONS_SYNC_INTERVAL_MINUTES"] 
            ?? "5");
        _syncInterval = TimeSpan.FromMinutes(intervalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "ProjectionsSyncWorker started. Will sync every {Interval} minutes",
            _syncInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncProjectionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ProjectionsSyncWorker execution cycle");
            }

            // Wait for the configured interval before next sync
            await Task.Delay(_syncInterval, stoppingToken);
        }
    }

    private async Task SyncProjectionsAsync(CancellationToken cancellationToken)
    {
        try
        {
            var apiBaseUrl = _configuration["Services:OnboardingApi:BaseUrl"] 
                ?? _configuration["ONBOARDING_API_BASE_URL"] 
                ?? "http://onboarding-api:8001";

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(60);
            
            // Add internal service authentication headers for development mode
            client.DefaultRequestHeaders.Add("X-User-Email", "system@internal.service");
            client.DefaultRequestHeaders.Add("X-User-Name", "Projections Sync Worker");
            client.DefaultRequestHeaders.Add("X-User-Role", "System");
            client.DefaultRequestHeaders.Add("X-Internal-Service", "true");

            // Use incremental sync (only sync new/updated cases)
            var syncUrl = $"{apiBaseUrl}/api/v1/sync?forceFullSync=false";
            
            _logger.LogDebug("Triggering incremental projections sync at {Url}", syncUrl);

            var response = await client.PostAsync(syncUrl, null, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                
                var casesCreated = result.TryGetProperty("casesCreated", out var created) 
                    ? created.GetInt32() 
                    : 0;
                var casesUpdated = result.TryGetProperty("casesUpdated", out var updated) 
                    ? updated.GetInt32() 
                    : 0;

                if (casesCreated > 0 || casesUpdated > 0)
                {
                    _logger.LogInformation(
                        "Projections sync completed. Created: {Created}, Updated: {Updated}",
                        casesCreated, casesUpdated);
                }
                else
                {
                    _logger.LogDebug("Projections sync completed - no changes");
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "Projections sync returned {Status}: {Error}",
                    (int)response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync projections");
            // Don't throw - we'll retry on next interval
        }
    }
}

