using RiskService.Application.Interfaces;
using RiskService.Infrastructure.Persistence;
using RiskService.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using Sentry;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Sentry Error Monitoring
// ========================================
var sentryDsn = builder.Configuration["Sentry:Dsn"] ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
var sentryEnabled = builder.Configuration.GetValue<bool>("Sentry:Enabled", true);
var sentryEnabledEnv = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
if (sentryEnabledEnv != null) sentryEnabled = bool.Parse(sentryEnabledEnv);

if (!string.IsNullOrEmpty(sentryDsn) && sentryEnabled)
{
    var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "risk-service";
    var environment = builder.Environment.EnvironmentName;
    var release = Environment.GetEnvironmentVariable("SENTRY_RELEASE") ?? "unknown";
    
    builder.WebHost.UseSentry(options =>
    {
        options.Dsn = sentryDsn;
        options.Environment = environment;
        options.Release = release;
        options.TracesSampleRate = 0.1;
        options.SetTag("service", serviceName);
    });
}

// ========================================
// Logging (Serilog)
// ========================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-risk-api")
    .CreateLogger();

builder.Host.UseSerilog();

// ========================================
// Controllers & API
// ========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Risk API", Version = "v1" });
    
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// ========================================
// Database (PostgreSQL + EF Core)
// ========================================
builder.Services.AddDbContext<RiskDbContext>(options =>
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

// ========================================
// Repositories
// ========================================
builder.Services.AddScoped<IRiskAssessmentRepository, RiskAssessmentRepository>();

// ========================================
// MediatR + CQRS
// ========================================
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(RiskService.Application.Commands.CreateRiskAssessmentCommand).Assembly);
});

// ========================================
// Authentication (OAuth 2.1 / Keycloak)
// ========================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
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
                                var identity = principal.Identities.First();
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
    });

builder.Services.AddAuthorization(options =>
{
    // In development, allow anonymous access; in production, require authentication
    if (builder.Environment.IsDevelopment())
    {
        options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAssertion(_ => true) // Allow anonymous in development
            .Build();
    }
    else
    {
        options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .RequireRole("business-user")
            .Build();
    }
    
    // Allow anonymous access to health endpoints
    options.AddPolicy("AllowAnonymous", policy =>
    {
        policy.RequireAssertion(_ => true);
    });
});

// ========================================
// CORS
// ========================================
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ========================================
// Health Checks
// ========================================
builder.Services.AddHealthChecks()
    .AddDbContextCheck<RiskDbContext>();

var app = builder.Build();

// ========================================
// Middleware Pipeline
// ========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Risk Service API v1");
        c.RoutePrefix = string.Empty;
    });
}

// Sentry middleware
var sentryDsnApp = app.Configuration["Sentry:Dsn"] ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
var sentryEnabledApp = app.Configuration.GetValue<bool>("Sentry:Enabled", true);
var sentryEnabledEnvApp = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
if (sentryEnabledEnvApp != null) sentryEnabledApp = bool.Parse(sentryEnabledEnvApp);
if (!string.IsNullOrEmpty(sentryDsnApp) && sentryEnabledApp)
{
    app.UseSentryTracing();
}

app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// ========================================
// Database Migration
// ========================================
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<RiskDbContext>();
    try
    {
        // Check if database exists and is accessible
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect)
        {
            Log.Warning("Cannot connect to database. Will retry on first request.");
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
            Log.Information("Database migration completed successfully");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed. Service will continue but database operations may fail.");
        SentrySdk.CaptureException(ex);
        // Don't throw - allow service to start even if DB setup fails
        // The database will be created on first use or can be migrated manually
    }
}

Log.Information("Risk Service starting up...");

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    SentrySdk.CaptureException(ex);
}
finally
{
    Log.CloseAndFlush();
}
