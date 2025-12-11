using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Threading.Tasks;

namespace Shared.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        private readonly HealthCheckService _healthCheckService;

        public HealthController(HealthCheckService healthCheckService)
        {
            _healthCheckService = healthCheckService;
        }

        [HttpGet("live")]
        public IActionResult GetLive()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }

        [HttpGet("ready")]
        public async Task<IActionResult> GetReady()
        {
            var report = await _healthCheckService.CheckHealthAsync();
            
            if (report.Status == HealthStatus.Healthy)
            {
                return Ok(new 
                { 
                    status = "ready",
                    checks = report.Entries.Select(e => new 
                    {
                        name = e.Key,
                        status = e.Value.Status.ToString(),
                        duration = e.Value.Duration.TotalMilliseconds
                    }),
                    timestamp = DateTime.UtcNow
                });
            }
            
            return StatusCode(503, new 
            { 
                status = "not_ready",
                checks = report.Entries.Select(e => new 
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    error = e.Value.Exception?.Message,
                    duration = e.Value.Duration.TotalMilliseconds
                }),
                timestamp = DateTime.UtcNow
            });
        }
    }
}
