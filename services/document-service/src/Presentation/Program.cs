using DocumentService.Infrastructure.Persistence;
using DocumentService.Infrastructure.Services;
using DocumentService.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Minio;
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
    var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "document-service";
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

// Add services to the container
builder.Services.AddControllers();

// Database
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=postgres;Database=documents;Username=kyb;Password=kyb_password";

builder.Services.AddDbContext<DocumentDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories
builder.Services.AddScoped<DocumentService.Application.Interfaces.IDocumentRepository, DocumentService.Infrastructure.Repositories.DocumentRepository>();

// MinIO Object Storage - REAL IMPLEMENTATION (no mocks)
// Documents are stored in MinIO object storage at the configured endpoint
builder.Services.Configure<MinIOOptions>(builder.Configuration.GetSection("Storage"));
builder.Services.AddSingleton<IMinioClient>(provider =>
{
    var options = provider.GetRequiredService<IOptions<MinIOOptions>>().Value;
    return new MinioClient()
        .WithEndpoint(options.Endpoint)
        .WithCredentials(options.AccessKey, options.SecretKey)
        .WithSSL(options.UseSSL)
        .Build();
});
// Register MinIOObjectStorage - this uploads files to actual MinIO storage
builder.Services.AddScoped<DocumentService.Application.Interfaces.IObjectStorage, MinIOObjectStorage>();

// ClamAV Virus Scanner
builder.Services.Configure<ClamAVOptions>(builder.Configuration.GetSection("ClamAv"));
builder.Services.AddScoped<DocumentService.Application.Commands.IVirusScanner, ClamAVVirusScanner>();

// MediatR
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(DocumentService.Application.Commands.UploadDocumentCommand).Assembly);
});

// Content Hash Deduplicator (registered after MediatR to avoid circular dependencies)
builder.Services.AddScoped<DocumentService.Application.Commands.IContentHashDeduplicator, ContentHashDeduplicatorService>();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Document API",
        Version = "v1",
        Description = "Manages document uploads and storage for KYB processes",
        Contact = new OpenApiContact
        {
            Name = "KYB Platform Team",
            Email = "devops@mukuru.com"
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Authentication (Keycloak) - conditionally enabled
var authenticationEnabled = builder.Configuration.GetValue<bool>("Authentication:Enabled", true);
if (authenticationEnabled)
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = builder.Configuration["Keycloak:Authority"];
            options.Audience = builder.Configuration["Keycloak:Audience"];
            options.RequireHttpsMetadata = true;

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
        options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .RequireRole("business-user")
            .Build();
    });
}

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<DocumentDbContext>("database");

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
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

app.UseCors("AllowAll");
if (authenticationEnabled)
{
    app.UseAuthentication();
    app.UseAuthorization();
}
app.MapControllers();

// ========================================
// Database Migration
// ========================================
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DocumentDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        Console.WriteLine("Document database migration completed successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Document database migration failed: {ex.Message}");
        SentrySdk.CaptureException(ex);
        throw;
    }
}

// Health check endpoints
app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

app.Run();
