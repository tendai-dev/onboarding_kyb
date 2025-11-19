using OnboardingApi.Application.Interfaces;
using System.Text.Json;

namespace OnboardingApi.Presentation.Middleware;

/// <summary>
/// Middleware that validates Azure AD group membership for authenticated users
/// </summary>
public class PermissionsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PermissionsMiddleware> _logger;

    public PermissionsMiddleware(RequestDelegate next, ILogger<PermissionsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext httpContext,
        ICurrentUser currentUser,
        IConfiguration configuration)
    {
        // Check if the user is authenticated
        if (httpContext.User.Identity is not { IsAuthenticated: true })
        {
            await _next(httpContext);
            return;
        }

        // Get authentication scheme
        var authScheme = httpContext.User.Identity.AuthenticationType;
        
        // In development mode, allow "Development" scheme to bypass permission checks
        if (authScheme == "Development")
        {
            _logger.LogDebug("Development authentication scheme detected - bypassing permission checks");
            await _next(httpContext);
            return;
        }

        var user = await currentUser.GetUserAsync();

        // Check if user identity is null
        if (user.Identity == null)
        {
            _logger.LogWarning("User identity is missing or null");
            
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            httpContext.Response.ContentType = "application/json";
            
            var errorResponse = new
            {
                status = "Fail",
                statusCode = 401,
                message = "User identity is missing or null.",
                timestamp = DateTime.UtcNow
            };
            
            await httpContext.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
            return;
        }

        // Handle Azure AD (internal users) - check group membership
        if (authScheme == "AzureAD")
        {
            var entraGroupId = configuration["AzureAd:EntraGroupId"];
            
            if (!string.IsNullOrEmpty(entraGroupId))
            {
                var userGroups = currentUser.Groups.ToList();
                
                if (!userGroups.Contains(entraGroupId))
                {
                    _logger.LogWarning(
                        "Azure AD user {UserId} ({Email}) is not part of authorized group {GroupId}. User groups: {UserGroups}",
                        currentUser.UserId,
                        currentUser.Email,
                        entraGroupId,
                        string.Join(", ", userGroups));
                    
                    httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                    httpContext.Response.ContentType = "application/json";
                    
                    var errorResponse = new
                    {
                        status = "Fail",
                        statusCode = 403,
                        message = "The Azure AD user is not part of an authorized group.",
                        timestamp = DateTime.UtcNow
                    };
                    
                    await httpContext.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
                    return;
                }
                
                _logger.LogInformation(
                    "Azure AD user {UserId} ({Email}) validated successfully with group {GroupId}",
                    currentUser.UserId,
                    currentUser.Email,
                    entraGroupId);
            }
        }
        // Handle Keycloak (external users) - check organization mapping
        else if (authScheme == "Keycloak")
        {
            var orgId = user.OrganizationId;
            
            if (string.IsNullOrEmpty(orgId))
            {
                _logger.LogWarning(
                    "Keycloak user {Email} does not have an organization mapping",
                    currentUser.Email);
                
                httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                httpContext.Response.ContentType = "application/json";
                
                var errorResponse = new
                {
                    status = "Fail",
                    statusCode = 403,
                    message = "User is not associated with an organization. Please contact support.",
                    timestamp = DateTime.UtcNow
                };
                
                await httpContext.Response.WriteAsync(JsonSerializer.Serialize(errorResponse));
                return;
            }
            
            _logger.LogInformation(
                "Keycloak user {Email} (preferred_username: {PreferredUsername}) validated successfully with organization {OrgId}",
                currentUser.Email,
                httpContext.User.FindFirst("preferred_username")?.Value,
                orgId);
        }

        // Permissions met, continue with execution
        await _next(httpContext);
    }
}

/// <summary>
/// Extension methods for registering PermissionsMiddleware
/// </summary>
public static class PermissionsMiddlewareExtensions
{
    public static IApplicationBuilder UsePermissionsMiddleware(this IApplicationBuilder app)
    {
        return app.UseMiddleware<PermissionsMiddleware>();
    }
}

