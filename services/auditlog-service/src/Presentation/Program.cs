using AuditLogService.Application.Interfaces;
using AuditLogService.Infrastructure.Persistence;
using AuditLogService.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Serilog;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Logging (Serilog)
// ========================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-audit-api")
    .CreateLogger();

builder.Host.UseSerilog();

// ========================================
// Controllers & API
// ========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Audit API", Version = "v1" });
    
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
builder.Services.AddDbContext<AuditLogDbContext>(options =>
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
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();

// ========================================
// MediatR + CQRS
// ========================================
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(AuditLogService.Application.Commands.CreateAuditLogEntryCommand).Assembly);
});

// ========================================
// Event Handlers
// ========================================
builder.Services.AddScoped<AuditLogService.Application.EventHandlers.DomainEventAuditLogHandler>();

// ========================================
// Background Services (Kafka Consumer)
// ========================================
builder.Services.AddHostedService<AuditLogService.Infrastructure.EventConsumers.KafkaEventConsumer>();

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
    .AddDbContextCheck<AuditLogDbContext>();

var app = builder.Build();

// ========================================
// Middleware Pipeline
// ========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Audit Log Service API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true // Full health check including database
}).RequireAuthorization("AllowAnonymous");
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // Liveness check doesn't include database
}).RequireAuthorization("AllowAnonymous");

// ========================================
// Database Migration
// ========================================
using var scope = app.Services.CreateScope();
var auditContext = scope.ServiceProvider.GetRequiredService<AuditLogDbContext>();
var maxRetries = 5;
var delay = TimeSpan.FromSeconds(5);
for (int i = 0; i < maxRetries; i++)
{
    try
    {
        await auditContext.Database.EnsureCreatedAsync();
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

Log.Information("Audit Log Service starting up...");

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
