using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuthenticationService.Application.Services;
using System.Security.Claims;

namespace AuthenticationService.Presentation.Controllers;

/// <summary>
/// Authentication controller for centralized auth service
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationService _authService;
    private readonly ISessionService _sessionService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthenticationService authService,
        ISessionService sessionService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Validate JWT token
    /// </summary>
    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ValidateToken([FromBody] ValidateTokenRequest request)
    {
        try
        {
            var result = await _authService.ValidateTokenAsync(request.Token);
            
            if (!result.IsValid)
            {
                return Unauthorized(new { error = result.ErrorMessage ?? "Invalid token" });
            }

            var response = new TokenValidationResponse
            {
                Valid = true,
                UserId = result.User!.Id,
                Email = result.User.Email,
                FullName = result.User.GetFullName(),
                Roles = result.Roles,
                Permissions = result.Permissions,
                Claims = result.Claims,
                ExpiresAt = result.ExpiresAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return Unauthorized(new { error = "Token validation failed" });
        }
    }

    /// <summary>
    /// Introspect token (detailed information)
    /// </summary>
    [HttpPost("introspect")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenIntrospectionResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> IntrospectToken([FromBody] IntrospectTokenRequest request)
    {
        try
        {
            var result = await _authService.IntrospectTokenAsync(request.Token);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error introspecting token");
            return BadRequest(new { error = "Token introspection failed" });
        }
    }

    /// <summary>
    /// Initiate login flow
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginInitiationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> InitiateLogin([FromBody] InitiateLoginRequest request)
    {
        try
        {
            var result = await _authService.InitiateLoginAsync(request.Provider, request.ReturnUrl);
            
            if (!result.Success)
            {
                return BadRequest(new { error = result.ErrorMessage });
            }

            var response = new LoginInitiationResponse
            {
                AuthorizationUrl = result.AuthorizationUrl!,
                State = result.State
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating login for provider {Provider}", request.Provider);
            return BadRequest(new { error = "Login initiation failed" });
        }
    }

    /// <summary>
    /// Handle OAuth callback
    /// </summary>
    [HttpPost("callback")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginCallbackResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> HandleCallback([FromBody] LoginCallbackRequest request)
    {
        try
        {
            var result = await _authService.HandleLoginCallbackAsync(
                request.Provider, 
                request.Code, 
                request.State);
            
            if (!result.Success)
            {
                return BadRequest(new { error = result.ErrorMessage });
            }

            // Create session
            var deviceInfo = Request.Headers.UserAgent.ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var session = await _sessionService.CreateSessionAsync(
                result.User!.Id, 
                deviceInfo, 
                ipAddress);

            var response = new LoginCallbackResponse
            {
                Success = true,
                User = new UserDto
                {
                    Id = result.User.Id,
                    Email = result.User.Email,
                    FirstName = result.User.FirstName,
                    LastName = result.User.LastName,
                    FullName = result.User.GetFullName(),
                    ProfileImageUrl = result.User.ProfileImageUrl,
                    Status = result.User.Status.ToString(),
                    CreatedAt = result.User.CreatedAt,
                    LastLoginAt = result.User.LastLoginAt
                },
                AccessToken = result.AccessToken,
                RefreshToken = result.RefreshToken,
                ExpiresAt = result.ExpiresAt,
                SessionId = session.Id,
                RedirectUrl = result.RedirectUrl
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling callback for provider {Provider}", request.Provider);
            return BadRequest(new { error = "Callback handling failed" });
        }
    }

    /// <summary>
    /// Refresh JWT token
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenRefreshResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(request.RefreshToken);
            
            if (!result.Success)
            {
                return Unauthorized(new { error = result.ErrorMessage });
            }

            var response = new TokenRefreshResponse
            {
                AccessToken = result.AccessToken!,
                RefreshToken = result.RefreshToken,
                ExpiresAt = result.ExpiresAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return Unauthorized(new { error = "Token refresh failed" });
        }
    }

    /// <summary>
    /// Logout user
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(LogoutResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? request = null)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "User ID not found in token" });
            }

            var result = await _authService.LogoutAsync(userId, request?.SessionId);
            
            // Invalidate session(s)
            if (!string.IsNullOrEmpty(request?.SessionId))
            {
                await _sessionService.InvalidateSessionAsync(request.SessionId);
            }
            else
            {
                await _sessionService.InvalidateAllUserSessionsAsync(Guid.Parse(userId));
            }

            var response = new LogoutResponse
            {
                Success = result.Success,
                LogoutUrl = result.LogoutUrl
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return BadRequest(new { error = "Logout failed" });
        }
    }

    /// <summary>
    /// Get JSON Web Key Set (JWKS)
    /// </summary>
    [HttpGet("jwks")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetJwks()
    {
        try
        {
            // Return JWKS for token validation by other services
            // This would typically be generated from your signing keys
            var jwks = new
            {
                keys = new[]
                {
                    new
                    {
                        kty = "RSA",
                        use = "sig",
                        kid = "auth-service-key-1",
                        alg = "RS256",
                        // Add your public key parameters here
                        n = "...", // RSA modulus
                        e = "AQAB" // RSA exponent
                    }
                }
            };

            return Ok(jwks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving JWKS");
            return StatusCode(500, new { error = "JWKS retrieval failed" });
        }
    }
}

// Request/Response DTOs
public class ValidateTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public class TokenValidationResponse
{
    public bool Valid { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public Dictionary<string, object> Claims { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
}

public class IntrospectTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public class InitiateLoginRequest
{
    public string Provider { get; set; } = string.Empty;
    public string? ReturnUrl { get; set; }
}

public class LoginInitiationResponse
{
    public string AuthorizationUrl { get; set; } = string.Empty;
    public string? State { get; set; }
}

public class LoginCallbackRequest
{
    public string Provider { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? State { get; set; }
}

public class LoginCallbackResponse
{
    public bool Success { get; set; }
    public UserDto? User { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? SessionId { get; set; }
    public string? RedirectUrl { get; set; }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class TokenRefreshResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class LogoutRequest
{
    public string? SessionId { get; set; }
}

public class LogoutResponse
{
    public bool Success { get; set; }
    public string? LogoutUrl { get; set; }
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
