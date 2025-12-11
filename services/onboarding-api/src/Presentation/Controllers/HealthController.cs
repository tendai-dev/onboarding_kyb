using Microsoft.AspNetCore.Mvc;

namespace OnboardingApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", service = "onboarding-api", timestamp = DateTime.UtcNow });
    }

    [HttpGet("ready")]
    public IActionResult Ready()
    {
        return Ok(new { status = "ready", service = "onboarding-api" });
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new { status = "live", service = "onboarding-api" });
    }
}
