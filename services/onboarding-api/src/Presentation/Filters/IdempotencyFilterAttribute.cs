using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using StackExchange.Redis;
using System.Text.Json;

namespace OnboardingApi.Presentation.Filters;

/// <summary>
/// Idempotency filter attribute for POST/PUT/PATCH/DELETE operations
/// Requires Idempotency-Key header
/// </summary>
public class IdempotencyFilterAttribute : ActionFilterAttribute
{
    private const string IdempotencyKeyHeader = "Idempotency-Key";

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Only apply to state-changing operations
        if (context.HttpContext.Request.Method is not ("POST" or "PUT" or "PATCH" or "DELETE"))
        {
            await next();
            return;
        }

        // Get idempotency key from header
        if (!context.HttpContext.Request.Headers.TryGetValue(IdempotencyKeyHeader, out var idempotencyKey) ||
            string.IsNullOrWhiteSpace(idempotencyKey))
        {
            context.Result = new BadRequestObjectResult(new
            {
                name = "MissingIdempotencyKey",
                message = $"Header '{IdempotencyKeyHeader}' is required for state-changing operations",
                debug_id = context.HttpContext.TraceIdentifier
            });
            return;
        }

        // Validate UUID format
        if (!Guid.TryParse(idempotencyKey, out _))
        {
            context.Result = new BadRequestObjectResult(new
            {
                name = "InvalidIdempotencyKey",
                message = $"Header '{IdempotencyKeyHeader}' must be a valid UUID",
                debug_id = context.HttpContext.TraceIdentifier
            });
            return;
        }

        var redis = context.HttpContext.RequestServices.GetRequiredService<IConnectionMultiplexer>();
        var db = redis.GetDatabase();

        var cacheKey = $"idempotency:{idempotencyKey}";

        // Check if request was already processed
        var cachedResponse = await db.StringGetAsync(cacheKey);
        if (cachedResponse.HasValue)
        {
            var response = JsonSerializer.Deserialize<CachedResponse>(cachedResponse!);
            if (response != null)
            {
                context.HttpContext.Response.StatusCode = response.StatusCode;
                context.HttpContext.Response.ContentType = "application/json";
                context.Result = new ContentResult
                {
                    Content = response.Body,
                    ContentType = "application/json",
                    StatusCode = response.StatusCode
                };
                return;
            }
        }

        // Execute action
        var executedContext = await next();

        // Cache successful responses (2xx)
        if (executedContext.Result is ObjectResult objectResult &&
            objectResult.StatusCode is >= 200 and < 300)
        {
            var responseToCache = new CachedResponse
            {
                StatusCode = objectResult.StatusCode ?? 200,
                Body = JsonSerializer.Serialize(objectResult.Value)
            };

            await db.StringSetAsync(
                cacheKey,
                JsonSerializer.Serialize(responseToCache),
                TimeSpan.FromHours(24));
        }
    }

    private class CachedResponse
    {
        public int StatusCode { get; set; }
        public string Body { get; set; } = string.Empty;
    }
}

