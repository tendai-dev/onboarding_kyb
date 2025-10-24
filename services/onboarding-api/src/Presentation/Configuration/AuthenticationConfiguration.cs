using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Configuration;

public static class AuthenticationConfiguration
{
    public static IServiceCollection AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure JWT Bearer authentication for Keycloak
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer("Keycloak", options =>
        {
            var keycloakUrl = configuration["Authentication:Keycloak:Authority"] ?? "http://keycloak.158.220.110.88.nip.io/realms/kyc-platform";
            
            options.Authority = keycloakUrl;
            options.Audience = configuration["Authentication:Keycloak:Audience"] ?? "account";
            options.RequireHttpsMetadata = false; // For development
            options.SaveToken = true;
            
            // Configure metadata address to use internal service for key retrieval
            options.MetadataAddress = "http://keycloak.keycloak.svc.cluster.local:8080/realms/kyc-platform/.well-known/openid_configuration";
            
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = false, // Keycloak doesn't always include audience
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ClockSkew = TimeSpan.FromMinutes(5),
                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogError(context.Exception, "JWT Authentication failed");
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var claims = context.Principal?.Claims.Select(c => $"{c.Type}: {c.Value}");
                    logger.LogInformation("JWT Token validated. Claims: {Claims}", string.Join(", ", claims ?? Array.Empty<string>()));
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogWarning("JWT Challenge triggered. Error: {Error}, Description: {Description}", 
                        context.Error, context.ErrorDescription);
                    return Task.CompletedTask;
                }
            };
        })
        .AddJwtBearer("ActiveDirectory", options =>
        {
            // Active Directory / ADFS configuration
            var adfsUrl = configuration["Authentication:ActiveDirectory:Authority"] ?? "https://your-adfs-server.com/adfs";
            
            options.Authority = adfsUrl;
            options.Audience = configuration["Authentication:ActiveDirectory:Audience"] ?? "kyc-platform";
            options.RequireHttpsMetadata = true;
            options.SaveToken = true;
            
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ClockSkew = TimeSpan.FromMinutes(5),
                NameClaimType = "upn", // User Principal Name for AD
                RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            };
        })
        .AddJwtBearer("AzureAD", options =>
        {
            // Entra AD (Azure AD) configuration
            var azureAdInstance = configuration["AzureAd:Instance"] ?? "https://login.microsoftonline.com/";
            var tenantId = configuration["AzureAd:TenantId"];
            var clientId = configuration["AzureAd:ClientId"];
            
            options.Authority = $"{azureAdInstance}{tenantId}";
            options.Audience = clientId;
            options.SaveToken = true;
            options.RequireHttpsMetadata = false; // Set to true in production
            
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidAudiences = new[]
                {
                    clientId,
                    $"api://{clientId}"
                },
                ValidIssuers = new[]
                {
                    $"https://sts.windows.net/{tenantId}/",
                    $"{azureAdInstance}{tenantId}/v2.0"
                },
                ClockSkew = TimeSpan.FromMinutes(5),
                NameClaimType = "name",
                RoleClaimType = "roles"
            };
            
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogError(context.Exception, "Azure AD Authentication failed");
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var claims = context.Principal?.Claims.Select(c => $"{c.Type}: {c.Value}");
                    logger.LogInformation("Azure AD Token validated. Claims: {Claims}", string.Join(", ", claims ?? Array.Empty<string>()));
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    logger.LogError("Azure AD Authentication failed: {Error}, Exception: {Exception}", 
                        context.ErrorDescription, context.Error);
                    
                    var result = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        status = "Fail",
                        statusCode = 401,
                        informationLink = context.ErrorUri,
                        details = context.Error,
                        message = context.ErrorDescription ?? "No token"
                    });
                    
                    return context.Response.WriteAsync(result);
                }
            };
        });

        // Configure authorization policies
        services.AddAuthorization(options =>
        {
            // Default policy requires authentication
            options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddAuthenticationSchemes("Keycloak", "ActiveDirectory", "AzureAD")
                .Build();

            // Customer policy (external users via Keycloak)
            options.AddPolicy("CustomerPolicy", policy =>
                policy.RequireAuthenticatedUser()
                      .RequireAssertion(context => context.User.IsExternalUser())
                      .AddAuthenticationSchemes("Keycloak"));

            // Admin policy (internal users via AD, Azure AD, or Keycloak)
            options.AddPolicy("AdminPolicy", policy =>
                policy.RequireAuthenticatedUser()
                      .RequireAssertion(context =>
                      {
                          var realmRoles = context.User.FindFirst("realm_access")?.Value ?? "";
                          var azureRoles = context.User.FindAll("roles").Select(c => c.Value);
                          var azureGroups = context.User.FindAll("groups").Select(c => c.Value);
                          
                          return realmRoles.Contains("admin") ||
                                 context.User.HasClaim(ClaimTypes.Role, "admin") ||
                                 context.User.HasClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "admin") ||
                                 azureRoles.Contains("admin") ||
                                 azureGroups.Any(g => g == configuration["AzureAd:EntraGroupId"]);
                      })
                      .AddAuthenticationSchemes("Keycloak", "ActiveDirectory", "AzureAD"));

            // Reviewer policy
            options.AddPolicy("ReviewerPolicy", policy =>
                policy.RequireAuthenticatedUser()
                      .RequireAssertion(context =>
                      {
                          var realmRoles = context.User.FindFirst("realm_access")?.Value ?? "";
                          var azureRoles = context.User.FindAll("roles").Select(c => c.Value);
                          
                          return realmRoles.Contains("reviewer") ||
                                 context.User.HasClaim(ClaimTypes.Role, "reviewer") ||
                                 context.User.HasClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "reviewer") ||
                                 azureRoles.Contains("reviewer");
                      })
                      .AddAuthenticationSchemes("Keycloak", "ActiveDirectory", "AzureAD"));

            // Approver policy
            options.AddPolicy("ApproverPolicy", policy =>
                policy.RequireAuthenticatedUser()
                      .RequireAssertion(context =>
                      {
                          var realmRoles = context.User.FindFirst("realm_access")?.Value ?? "";
                          var azureRoles = context.User.FindAll("roles").Select(c => c.Value);
                          
                          return realmRoles.Contains("approver") ||
                                 context.User.HasClaim(ClaimTypes.Role, "approver") ||
                                 context.User.HasClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "approver") ||
                                 azureRoles.Contains("approver");
                      })
                      .AddAuthenticationSchemes("Keycloak", "ActiveDirectory", "AzureAD"));
        });

        return services;
    }

    public static WebApplication UseAuthenticationMiddleware(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
        
        return app;
    }
}

public static class ClaimsExtensions
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value ?? 
               user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
               user.FindFirst("upn")?.Value ?? 
               user.Identity?.Name ?? 
               "anonymous";
    }

    public static string GetUserEmail(this ClaimsPrincipal user)
    {
        return user.FindFirst("email")?.Value ?? 
               user.FindFirst(ClaimTypes.Email)?.Value ?? 
               user.FindFirst("preferred_username")?.Value ?? // Keycloak provides email here
               user.FindFirst("upn")?.Value ?? 
               "";
    }
    
    public static string GetPreferredUsername(this ClaimsPrincipal user)
    {
        // Keycloak specific: preferred_username contains user's email
        return user.FindFirst("preferred_username")?.Value ?? 
               user.FindFirst("email")?.Value ?? 
               "";
    }

    public static string GetUserRole(this ClaimsPrincipal user)
    {
        // Check Keycloak realm roles
        var realmRoles = user.FindFirst("realm_access")?.Value;
        if (!string.IsNullOrEmpty(realmRoles))
        {
            if (realmRoles.Contains("admin")) return "admin";
            if (realmRoles.Contains("reviewer")) return "reviewer";
            if (realmRoles.Contains("approver")) return "approver";
            if (realmRoles.Contains("customer")) return "customer";
        }

        // Check standard role claims (for AD)
        var role = user.FindFirst(ClaimTypes.Role)?.Value ?? 
                  user.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;
        
        return role ?? "customer";
    }

    public static bool IsExternalUser(this ClaimsPrincipal user)
    {
        // External users come through Keycloak
        // They authenticate via "Keycloak" scheme and have preferred_username claim
        var authType = user.Identity?.AuthenticationType;
        var hasPreferredUsername = user.FindFirst("preferred_username") != null;
        
        return authType == "Keycloak" || hasPreferredUsername;
    }

    public static bool IsInternalUser(this ClaimsPrincipal user)
    {
        // Internal users come through Azure AD
        // They authenticate via "AzureAD" scheme and have oid or groups claims
        var authType = user.Identity?.AuthenticationType;
        var hasOid = user.FindFirst("oid") != null; // Azure AD Object ID
        var hasGroups = user.FindAll("groups").Any(); // Azure AD groups
        
        return authType == "AzureAD" || hasOid || hasGroups;
    }
}
