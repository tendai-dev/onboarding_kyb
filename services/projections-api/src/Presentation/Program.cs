using ProjectionsApi.Application.Interfaces;
using ProjectionsApi.Infrastructure.Persistence;
using ProjectionsApi.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System.Reflection;
using System.Data;
using Npgsql;
using System.Security.Claims;
using System.Text.Json;
using MediatR;
using ProjectionsApi.Application.Commands;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Logging (Serilog)
// ========================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-projections-api")
    .CreateLogger();

builder.Host.UseSerilog();

// ========================================
// Controllers & API
// ========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Projections API", Version = "v1" });
    
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// ========================================
// Database (PostgreSQL + EF Core + Dapper)
// ========================================
builder.Services.AddDbContext<ProjectionsDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        });
});

// Add Dapper connection for raw SQL queries
builder.Services.AddScoped<IDbConnection>(provider =>
{
    var connectionString = builder.Configuration.GetConnectionString("PostgreSQL");
    return new NpgsqlConnection(connectionString);
});

// ========================================
// Repositories
// ========================================
builder.Services.AddScoped<IProjectionRepository, ProjectionRepository>();

// ========================================
// Services
// ========================================
builder.Services.AddScoped<ProjectionsApi.Infrastructure.Services.SyncOnboardingCasesService>();

// ========================================
// MediatR + CQRS
// ========================================
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(ProjectionsApi.Application.Queries.GetOnboardingCasesQuery).Assembly);
});

// ========================================
// Authentication (Dual: Keycloak + Azure AD)
// ========================================
// Add reference to shared authentication library
// using Shared.Authentication;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    // Keycloak authentication for regular users
    .AddJwtBearer("Keycloak", options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Keycloak:Authority"],
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
        var tenantId = builder.Configuration["AzureAd:TenantId"];
        var clientId = builder.Configuration["AzureAd:ClientId"];
        
        options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
        options.Audience = clientId;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
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
                            var adminGroupId = builder.Configuration["AzureAd:AdminGroupId"];
                            
                            if (groupsClaim is JsonElement groupsElement && 
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
                        }
                        catch
                        {
                            // ignore malformed groups
                        }
                    }
                    
                    // In development, auto-assign admin role if no groups found
                    if (builder.Environment.IsDevelopment() && !identity.HasClaim(ClaimTypes.Role, "admin"))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, "admin"));
                        identity.AddClaim(new Claim(ClaimTypes.Role, "business-user"));
                    }
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Log.Warning("Azure AD authentication failed: {Error}", context.Exception?.Message);
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    if (builder.Environment.IsDevelopment())
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

// ========================================
// CORS (Enabled for local development - gateway handles in production)
// ========================================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000", "http://localhost:3001", "https://localhost:3001", "http://localhost:3002", "http://localhost:3003") // React dev servers
              .AllowAnyMethod()
              .AllowAnyHeader() // This includes X-User-Id, X-User-Email, X-User-Name, X-User-Role
              .AllowCredentials();
    });
});

// ========================================
// Caching for performance
// ========================================
builder.Services.AddMemoryCache();
builder.Services.AddResponseCaching();

// ========================================
// Health Checks
// ========================================
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ProjectionsDbContext>();

var app = builder.Build();

// ========================================
// Middleware Pipeline
// ========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Projections API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseSerilogRequestLogging();
app.UseCors(); // Enable CORS for local development
app.UseResponseCaching();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // Liveness check doesn't include database
});

// ========================================
// Database Migration
// ========================================
using var scope = app.Services.CreateScope();
var projectionsContext = scope.ServiceProvider.GetRequiredService<ProjectionsDbContext>();
var maxRetries = 5;
var delay = TimeSpan.FromSeconds(5);
for (int i = 0; i < maxRetries; i++)
{
    try
    {
        await projectionsContext.Database.EnsureCreatedAsync();
        Log.Information("Database migration completed successfully");
        break;
    }
    catch (Exception ex) when (i < maxRetries - 1)
    {
        Log.Warning(ex, "Database migration attempt {Attempt} failed, retrying in {Delay}s...", i + 1, delay.TotalSeconds);
        await Task.Delay(delay);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed after {Attempts} attempts: {Error}", maxRetries, ex.Message);
        throw;
    }
}

// Auto-sync onboarding cases on startup
try
{
    using var syncScope = app.Services.CreateScope();
    var syncService = syncScope.ServiceProvider.GetRequiredService<ProjectionsApi.Infrastructure.Services.SyncOnboardingCasesService>();
    var syncLogger = syncScope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    syncLogger.LogInformation("Performing initial sync of onboarding cases...");
    var syncResult = await syncService.SyncAsync(forceFullSync: true, CancellationToken.None);
    syncLogger.LogInformation("Initial sync completed: {Created} created, {Updated} updated, {Errors} errors", 
        syncResult.CasesCreated, syncResult.CasesUpdated, syncResult.Errors);
}
catch (Exception ex)
{
    Log.Warning(ex, "Initial sync failed, will retry on manual sync or next startup");
}

Log.Information("Projections API starting up...");

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
