using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text.Json;

namespace Shared.Authentication;

public static class DualAuthenticationExtensions
{
    /// <summary>
    /// Adds dual authentication support for both Keycloak (regular users) and Azure AD (admin users)
    /// </summary>
    public static IServiceCollection AddDualAuthentication(this IServiceCollection services, IConfiguration configuration, bool isDevelopment = false)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            // Keycloak authentication for regular users
            .AddJwtBearer("Keycloak", options =>
            {
                options.Authority = configuration["Keycloak:Authority"];
                options.Audience = configuration["Keycloak:Audience"];
                options.RequireHttpsMetadata = !isDevelopment;
                
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = configuration["Keycloak:Authority"],
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    RoleClaimType = ClaimTypes.Role,
                    ClockSkew = TimeSpan.FromMinutes(5)
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (context.Principal is { } principal)
                        {
                            // Add source claim to identify token type
                            var identity = principal.Identities.First();
                            identity.AddClaim(new Claim("token_source", "keycloak"));
                            
                            // Extract Keycloak roles
                            var accessToken = context.SecurityToken as System.IdentityModel.Tokens.Jwt.JwtSecurityToken;
                            var resourceAccessJson = accessToken?.Payload.TryGetValue("resource_access", out var ra) == true ? ra : null;
                            if (resourceAccessJson is not null)
                            {
                                try
                                {
                                    using var doc = JsonDocument.Parse(resourceAccessJson.ToString());
                                    if (doc.RootElement.TryGetProperty("resource:kyb-connect", out var resourceObj) &&
                                        resourceObj.TryGetProperty("roles", out var rolesElem) &&
                                        rolesElem.ValueKind == JsonValueKind.Array)
                                    {
                                        foreach (var roleVal in rolesElem.EnumerateArray())
                                        {
                                            var role = roleVal.GetString();
                                            if (!string.IsNullOrWhiteSpace(role))
                                            {
                                                identity.AddClaim(new Claim(ClaimTypes.Role, role));
                                            }
                                        }
                                    }
                                }
                                catch
                                {
                                    // ignore malformed roles
                                }
                            }
                        }
                        return Task.CompletedTask;
                    }
                };
            })
            // Azure AD authentication for admin users
            .AddJwtBearer("AzureAD", options =>
            {
                var tenantId = configuration["AzureAd:TenantId"];
                var clientId = configuration["AzureAd:ClientId"];
                
                options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
                options.Audience = clientId;
                options.RequireHttpsMetadata = !isDevelopment;
                
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
                        $"https://login.microsoftonline.com/{tenantId}/v2.0"
                    },
                    ClockSkew = TimeSpan.FromMinutes(5)
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (context.Principal is { } principal)
                        {
                            var identity = principal.Identities.First();
                            
                            // Add source claim to identify token type
                            identity.AddClaim(new Claim("token_source", "azure_ad"));
                            
                            // Extract Azure AD groups and map to roles
                            var accessToken = context.SecurityToken as System.IdentityModel.Tokens.Jwt.JwtSecurityToken;
                            var groupsClaim = accessToken?.Payload.TryGetValue("groups", out var groups) == true ? groups : null;
                            
                            if (groupsClaim is not null)
                            {
                                try
                                {
                                    var adminGroupId = configuration["AzureAd:AdminGroupId"];
                                    
                                    if (groupsClaim is System.Text.Json.JsonElement groupsElement && 
                                        groupsElement.ValueKind == JsonValueKind.Array)
                                    {
                                        foreach (var group in groupsElement.EnumerateArray())
                                        {
                                            var groupId = group.GetString();
                                            if (groupId == adminGroupId)
                                            {
                                                identity.AddClaim(new Claim(ClaimTypes.Role, "admin"));
                                                identity.AddClaim(new Claim(ClaimTypes.Role, "business-user"));
                                            }
                                        }
                                    }
                                    else if (groupsClaim is string[] groupArray)
                                    {
                                        if (groupArray.Contains(adminGroupId))
                                        {
                                            identity.AddClaim(new Claim(ClaimTypes.Role, "admin"));
                                            identity.AddClaim(new Claim(ClaimTypes.Role, "business-user"));
                                        }
                                    }
                                }
                                catch
                                {
                                    // ignore malformed groups
                                }
                            }
                            
                            // In development, auto-assign admin role if no groups found
                            if (isDevelopment && !identity.HasClaim(ClaimTypes.Role, "admin"))
                            {
                                identity.AddClaim(new Claim(ClaimTypes.Role, "admin"));
                                identity.AddClaim(new Claim(ClaimTypes.Role, "business-user"));
                            }
                        }
                        return Task.CompletedTask;
                    },
                    OnAuthenticationFailed = context =>
                    {
                        // Log Azure AD authentication failures
                        var logger = context.HttpContext.RequestServices.GetService<ILogger<Program>>();
                        logger?.LogWarning("Azure AD authentication failed: {Error}", context.Exception?.Message);
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }

    /// <summary>
    /// Adds authorization policies that work with both authentication schemes
    /// </summary>
    public static IServiceCollection AddDualAuthorization(this IServiceCollection services, bool isDevelopment = false)
    {
        services.AddAuthorization(options =>
        {
            if (isDevelopment)
            {
                // In development, allow anonymous access
                options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                    .RequireAssertion(_ => true)
                    .Build();
                options.FallbackPolicy = options.DefaultPolicy;
            }
            else
            {
                // Production: require authentication from either scheme
                options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes("Keycloak", "AzureAD")
                    .RequireAuthenticatedUser()
                    .Build();
                    
                options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes("Keycloak", "AzureAD")
                    .RequireAuthenticatedUser()
                    .RequireRole("business-user")
                    .Build();
            }

            // Admin-only policy for Azure AD users
            options.AddPolicy("AdminOnly", policy =>
                policy.AddAuthenticationSchemes("AzureAD")
                      .RequireAuthenticatedUser()
                      .RequireRole("admin"));

            // Business user policy for both schemes
            options.AddPolicy("BusinessUser", policy =>
                policy.AddAuthenticationSchemes("Keycloak", "AzureAD")
                      .RequireAuthenticatedUser()
                      .RequireRole("business-user"));
        });

        return services;
    }
}
