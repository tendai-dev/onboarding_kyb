using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace OnboardingApi.Presentation.Middleware;

/// <summary>
/// Middleware for development mode that creates a fake authenticated user from headers
/// </summary>
public class DevelopmentAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DevelopmentAuthMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public DevelopmentAuthMiddleware(
        RequestDelegate next,
        ILogger<DevelopmentAuthMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only in development mode
        if (_environment.IsDevelopment())
        {
            // If user is not authenticated but has development headers, create a fake identity
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                var userEmail = context.Request.Headers["X-User-Email"].FirstOrDefault();
                var userName = context.Request.Headers["X-User-Name"].FirstOrDefault();
                var userRole = context.Request.Headers["X-User-Role"].FirstOrDefault();
                var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();

                if (!string.IsNullOrEmpty(userEmail))
                {
                    // Create a fake claims identity for development
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId ?? userEmail),
                        new Claim(ClaimTypes.Email, userEmail),
                        new Claim(ClaimTypes.Name, userName ?? userEmail),
                        new Claim("preferred_username", userEmail),
                        new Claim("email", userEmail)
                    };

                    if (!string.IsNullOrEmpty(userRole))
                    {
                        claims.Add(new Claim(ClaimTypes.Role, userRole));
                        claims.Add(new Claim("roles", userRole));
                    }

                    var identity = new ClaimsIdentity(claims, "Development", ClaimTypes.Name, ClaimTypes.Role);
                    context.User = new ClaimsPrincipal(identity);

                    _logger.LogDebug("Created development user identity for {Email}", userEmail);
                }
            }
        }

        await _next(context);
    }
}

public static class DevelopmentAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseDevelopmentAuth(this IApplicationBuilder app)
    {
        return app.UseMiddleware<DevelopmentAuthMiddleware>();
    }
}

