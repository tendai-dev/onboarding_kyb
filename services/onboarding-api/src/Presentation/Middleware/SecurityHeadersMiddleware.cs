using Microsoft.AspNetCore.Http;

namespace OnboardingApi.Presentation.Middleware;

/// <summary>
/// SECURITY: Middleware to add security headers to all responses
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;

    public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // SECURITY: Add security headers to all responses
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // HSTS - only add if HTTPS
        if (context.Request.IsHttps)
        {
            context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        }
        
        // Content Security Policy - restrict to same origin for API
        // Note: Adjust CSP based on your needs (e.g., if you need to allow specific external resources)
        context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none';");
        
        // Permissions Policy (formerly Feature Policy)
        context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

        await _next(context);
    }
}

