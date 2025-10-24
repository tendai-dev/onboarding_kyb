using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace DocumentService.Infrastructure.AntiVirus;

/// <summary>
/// Health check for ClamAV service availability
/// </summary>
public class ClamAvHealthCheck : IHealthCheck
{
    private readonly IClamAvClient _clamAvClient;
    private readonly ILogger<ClamAvHealthCheck> _logger;
    
    public ClamAvHealthCheck(IClamAvClient clamAvClient, ILogger<ClamAvHealthCheck> logger)
    {
        _clamAvClient = clamAvClient;
        _logger = logger;
    }
    
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var isHealthy = await _clamAvClient.PingAsync(cancellationToken);
            
            if (isHealthy)
            {
                return HealthCheckResult.Healthy("ClamAV is responsive");
            }
            else
            {
                return HealthCheckResult.Unhealthy("ClamAV is not responding");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ClamAV health check failed");
            return HealthCheckResult.Unhealthy("ClamAV health check failed", ex);
        }
    }
}

