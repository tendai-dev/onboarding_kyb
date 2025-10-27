using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Controllers;

/// <summary>
/// Authentication Controller for session-based auth
/// Matches the frontend's expected authentication endpoints
/// </summary>
[ApiController]
[Route("api")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get current user information
    /// </summary>
    [HttpGet("auth/user")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst("sub")?.Value ?? "system";
        var email = User.FindFirst("email")?.Value ?? "user@example.com";
        var firstName = User.FindFirst("given_name")?.Value ?? "User";
        var lastName = User.FindFirst("family_name")?.Value ?? "Name";
        var role = User.FindFirst("role")?.Value ?? "customer";

        var user = new UserDto
        {
            Id = userId,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            ProfileImageUrl = null,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        return Ok(user);
    }

    /// <summary>
    /// Login endpoint (redirects to OAuth provider)
    /// </summary>
    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login()
    {
        // In a real implementation, this would redirect to the OAuth provider
        // For now, we'll return a simple response
        return Ok(new { message = "Please use OAuth provider for authentication" });
    }

    /// <summary>
    /// Logout endpoint
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // In a real implementation, this would invalidate the session/token
        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// OAuth callback endpoint
    /// </summary>
    [HttpGet("callback")]
    [AllowAnonymous]
    public IActionResult Callback()
    {
        // In a real implementation, this would handle the OAuth callback
        return Ok(new { message = "OAuth callback processed" });
    }
}

