using EntityConfigurationService.Application.Interfaces;
using EntityConfigurationService.Application.Mapping;
using EntityConfigurationService.Presentation.Mapping;
using EntityConfigurationService.Infrastructure.Persistence;
using EntityConfigurationService.Infrastructure.Repositories;
using EntityConfigurationService.Infrastructure.ExternalData;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Linq;
using Mapster;
using MapsterMapper;
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
    var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "entity-configuration-service";
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
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to use camelCase naming policy
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Configure enum serialization to accept string names instead of integer values
        // Use null naming policy to accept exact enum names (e.g., "File", "Text") from frontend
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Configure Npgsql to handle DateTime with Unspecified kind as UTC
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);

builder.Services.AddDbContext<EntityConfigurationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
        npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

// MediatR
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(EntityConfigurationService.Application.Commands.CreateEntityTypeCommand).Assembly);
});

// Mapster
MapsterConfig.Configure(); // Basic domain mappings
MapsterDtoConfig.Configure(); // DTO mappings
builder.Services.AddSingleton<IMapper>(new MapsterMapper.Mapper(TypeAdapterConfig.GlobalSettings));

// Repositories
builder.Services.AddScoped<IEntityTypeRepository, EntityTypeRepository>();
builder.Services.AddScoped<IRequirementRepository, RequirementRepository>();
builder.Services.AddScoped<IWizardConfigurationRepository, WizardConfigurationRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();

// External data services
builder.Services.AddScoped<IExternalDataService, CompaniesHouseClient>();
builder.Services.AddHttpClient<CompaniesHouseClient>();

// Configure Companies House options
builder.Services.Configure<CompaniesHouseOptions>(builder.Configuration.GetSection("CompaniesHouse"));

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Entity Configuration Service API",
        Version = "v1",
        Description = "Manages entity types and their KYC requirements configuration",
        Contact = new OpenApiContact
        {
            Name = "KYC Platform Team",
            Email = "devops@mukuru.com"
        }
    });
});

// Authentication (Dual: Keycloak + Azure AD)
builder.Services.AddAuthentication("Bearer")
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
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            ClockSkew = TimeSpan.FromMinutes(5)
        };

        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal is { } principal)
                {
                    var identity = principal.Identities.First();
                    identity.AddClaim(new System.Security.Claims.Claim("token_source", "keycloak"));
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

        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal is { } principal)
                {
                    var identity = principal.Identities.First();
                    identity.AddClaim(new System.Security.Claims.Claim("token_source", "azure_ad"));
                    
                    // In development, auto-assign admin role
                    if (builder.Environment.IsDevelopment())
                    {
                        identity.AddClaim(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "admin"));
                        identity.AddClaim(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "business-user"));
                    }
                }
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
    }
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

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<EntityConfigurationDbContext>("database");

var app = builder.Build();

// Initialize database and seed data BEFORE starting the app
try
{
    await DbInitializer.InitializeAsync(app);
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Database initialization failed - will continue without seed data");
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Entity Configuration Service API v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

app.UseCors("AllowAll");

// Routing middleware (must be before endpoints)
app.UseRouting();

// Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Sentry middleware
var sentryDsn = app.Configuration["Sentry:Dsn"] ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
var sentryEnabled = app.Configuration.GetValue<bool>("Sentry:Enabled", true);
var sentryEnabledEnv = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
if (sentryEnabledEnv != null) sentryEnabled = bool.Parse(sentryEnabledEnv);
if (!string.IsNullOrEmpty(sentryDsn) && sentryEnabled)
{
    app.UseSentryTracing();
}

// Exception handling middleware (should be after routing, before authorization)
app.UseExceptionHandler("/error");

// Endpoint mapping
app.MapControllers();

// Global error handler endpoint
app.Map("/error", async (HttpContext context) =>
{
    var exceptionHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
    context.Response.StatusCode = 500;
    context.Response.ContentType = "application/json";
    
    if (exceptionHandlerFeature != null)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        var exception = exceptionHandlerFeature.Error;
        
        // Log the full exception including inner exceptions
        logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
        
        if (exception.InnerException != null)
        {
            logger.LogError(exception.InnerException, "Inner exception: {Message}", exception.InnerException.Message);
        }
        
        // Report to Sentry
        SentrySdk.WithScope(scope =>
        {
            scope.SetTag("endpoint", context.Request.Path);
            scope.SetTag("method", context.Request.Method);
            scope.SetTag("exception_type", exception.GetType().Name);
            scope.SetExtra("user", context.User?.Identity?.Name ?? "anonymous");
            SentrySdk.CaptureException(exception);
        });
        
        // Build detailed error message for development
        var errorMessage = exception.Message;
        if (exception.InnerException != null)
        {
            errorMessage += $" Inner: {exception.InnerException.Message}";
        }
        
        var errorResponse = new
        {
            error = "An error occurred while processing your request",
            message = app.Environment.IsDevelopment() 
                ? errorMessage 
                : "Internal server error",
            stackTrace = app.Environment.IsDevelopment() && exception.StackTrace != null
                ? exception.StackTrace.Split('\n').Take(10).ToArray()
                : null
        };
        
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
});

// Health check endpoints - map before other endpoints to avoid auth issues
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // Liveness check doesn't include database
});
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true // Readiness check includes database
});
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true // Full health check including database
});

app.Run();
