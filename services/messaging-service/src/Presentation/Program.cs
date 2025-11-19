using MessagingService.Presentation.Controllers;
using MessagingService.Presentation.Hubs;
using MessagingService.Domain.Interfaces;
using MessagingService.Infrastructure.Persistence;
using MessagingService.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using MediatR;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration)
        .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-messaging-api"));

// Database
builder.Services.AddDbContext<MessagingDbContext>(options =>
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
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(MessagingService.Application.Commands.SendMessageCommand).Assembly));

// Authentication - Support both Keycloak (partners) and Azure AD (admins)
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer("Keycloak", options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];
        options.Audience = builder.Configuration["Keycloak:Audience"];
        // In development, don't require HTTPS metadata validation
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
    })
    .AddJwtBearer("AzureAD", options =>
    {
        // Azure AD configuration for admin users
        var tenantId = builder.Configuration["AzureAd:TenantId"];
        var clientId = builder.Configuration["AzureAd:ClientId"];
        
        if (!string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(clientId))
        {
            options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
            options.Audience = clientId;
            options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
            
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
                ClockSkew = TimeSpan.FromMinutes(5),
                NameClaimType = "name",
                RoleClaimType = "roles"
            };
            
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    if (context.Principal is { } principal)
                    {
                        var identity = principal.Identities.First();
                        identity.AddClaim(new Claim("token_source", "azure_ad"));
                    }
                    return Task.CompletedTask;
                }
            };
        }
    });
builder.Services.AddAuthorization(options =>
{
    // Default policy accepts both Keycloak and Azure AD tokens
    var policyBuilder = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .AddAuthenticationSchemes("Keycloak", "AzureAD");
    
    // For development, allow anonymous access
    if (builder.Environment.IsDevelopment())
    {
        options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAssertion(_ => true) // Allow all requests in development
            .Build();
        options.FallbackPolicy = options.DefaultPolicy;
    }
    else
    {
        options.DefaultPolicy = policyBuilder.Build();
        options.FallbackPolicy = policyBuilder.Build();
    }
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Messaging API", Version = "v1" });
});
builder.Services.AddSignalR();

// CORS (Important for React frontend)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", 
                "https://localhost:3000", 
                "http://localhost:3001", 
                "https://localhost:3001", 
                "http://localhost:3002",
                "http://localhost:3003"
            ) // React dev servers (admin, partner, etc.)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<MessagingDbContext>();

var app = builder.Build();

// Auto-migrate database with retry logic
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MessagingDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    var maxRetries = 5;
    var delay = TimeSpan.FromSeconds(5);
    for (int i = 0; i < maxRetries; i++)
    {
        try
        {
            await db.Database.EnsureCreatedAsync();
            logger.LogInformation("Database migration completed successfully");
            break;
        }
        catch (Exception ex) when (i < maxRetries - 1)
        {
            logger.LogWarning(ex, "Database migration attempt {Attempt} failed, retrying in {Delay}s...", i + 1, delay.TotalSeconds);
            await Task.Delay(delay);
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must be before UseAuthentication and UseAuthorization
app.UseCors();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<MessageHub>("/messageHub");
app.MapHealthChecks("/health");

await app.RunAsync();
