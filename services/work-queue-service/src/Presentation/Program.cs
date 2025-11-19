using WorkQueueService.Presentation.Controllers;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Infrastructure.Persistence;
using WorkQueueService.Infrastructure.Repositories;
using WorkQueueService.Infrastructure.EventConsumers;
using Microsoft.EntityFrameworkCore;
using MediatR;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text.Json;
using Confluent.Kafka;

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration)
        .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-work-queue-service"));

// Database
builder.Services.AddDbContext<WorkQueueDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        }));

// Repositories
builder.Services.AddScoped<IWorkItemRepository, WorkItemRepository>();

// Services
builder.Services.AddScoped<WorkQueueService.Application.Interfaces.IWorkItemAssignmentService, WorkQueueService.Application.Services.WorkItemAssignmentService>();

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(WorkQueueService.Application.Commands.AssignWorkItemCommand).Assembly));

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        
        options.TokenValidationParameters = new TokenValidationParameters
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
        options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAssertion(_ => true) // Allow all requests in development
            .Build();
        options.FallbackPolicy = options.DefaultPolicy;
    }
    else
    {
        options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .RequireRole("business-user")
            .Build();
    }
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Work Queue Service", Version = "v1" });
});

// CORS is handled by the API Gateway (nginx), so we don't configure it here
// to avoid duplicate CORS headers which cause browser errors

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<WorkQueueDbContext>();

// Kafka Consumer for onboarding events
var kafkaConfig = new ConsumerConfig
{
    BootstrapServers = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
    GroupId = builder.Configuration["Kafka:ConsumerGroup"] ?? "work-queue-service",
    AutoOffsetReset = AutoOffsetReset.Earliest,
    EnableAutoCommit = false
};

builder.Services.AddSingleton<IConsumer<Ignore, string>>(sp =>
{
    var builderInstance = new ConsumerBuilder<Ignore, string>(kafkaConfig);
    return builderInstance.Build();
});

// Register the Kafka event consumer as a hosted service
builder.Services.AddHostedService<OnboardingCaseEventConsumer>();

// Register HTTP client factory for sync scheduler
builder.Services.AddHttpClient();

// Register the work queue sync scheduler (runs daily to sync work items)
builder.Services.AddHostedService<WorkQueueService.Infrastructure.Services.WorkQueueSyncScheduler>();

var app = builder.Build();

// Auto-migrate database with retry logic
using var scope = app.Services.CreateScope();
var workQueueContext = scope.ServiceProvider.GetRequiredService<WorkQueueDbContext>();
var logger = scope.ServiceProvider.GetRequiredService<Serilog.ILogger>();
var maxRetries = 5;
var delay = TimeSpan.FromSeconds(5);
for (int i = 0; i < maxRetries; i++)
{
    try
    {
        await workQueueContext.Database.EnsureCreatedAsync();
        logger.Information("Work Queue database migration completed successfully");
        break;
    }
    catch (Exception ex) when (i < maxRetries - 1)
    {
        logger.Warning(ex, "Work Queue database migration attempt {Attempt} failed, retrying in {Delay}s...", i + 1, delay.TotalSeconds);
        await Task.Delay(delay);
    }
    catch (Exception ex)
    {
        logger.Error(ex, "Work Queue database migration failed after {Attempts} attempts: {Error}", maxRetries, ex.Message);
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Remove HTTPS redirection in development (causes issues with localhost)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
// CORS is handled by API Gateway (nginx), not here
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

await app.RunAsync();
