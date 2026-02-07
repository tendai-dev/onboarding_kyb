using System.Diagnostics;
using Serilog.Context;

namespace OnboardingApi.Presentation.Middleware;

/// <summary>
/// Middleware that logs all API requests and responses with performance metrics.
/// Captures slow requests (>1s warning, >5s error) and excludes health checks.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health", "/healthz", "/ready", "/readyz", "/live", "/livez", "/metrics"
    };

    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization", "X-Api-Key", "Cookie", "Set-Cookie"
    };

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (ExcludedPaths.Any(p => context.Request.Path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        var headers = context.Request.Headers
            .Where(h => !SensitiveHeaders.Contains(h.Key))
            .ToDictionary(h => h.Key, h => h.Value.ToString());

        _logger.LogInformation(
            "HTTP {Method} {Path} started | Query: {Query} | Headers: {@Headers}",
            context.Request.Method, context.Request.Path, context.Request.QueryString.ToString(), headers);

        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            var durationMs = sw.ElapsedMilliseconds;
            var level = durationMs switch { > 5000 => LogLevel.Error, > 1000 => LogLevel.Warning, _ => LogLevel.Information };

            _logger.Log(level,
                "HTTP {Method} {Path} completed | Status: {StatusCode} | Duration: {Duration}ms",
                context.Request.Method, context.Request.Path, context.Response.StatusCode, durationMs);
        }
    }
}

public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
        => builder.UseMiddleware<RequestLoggingMiddleware>();
}
