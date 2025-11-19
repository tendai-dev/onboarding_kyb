using FluentValidation;
using Mapster;
using MapsterMapper;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using OnboardingApi.Application.Behaviors;
using OnboardingApi.Application.Commands;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.EventBus;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.Repositories;
using OnboardingApi.Presentation.Filters;
using OnboardingApi.Presentation.Configuration;
using OnboardingApi.Presentation.Middleware;
using OpenTelemetry.Exporter;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Prometheus;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.Elasticsearch;
using StackExchange.Redis;
using Shared.Sentry;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Sentry Error Monitoring
// ========================================
builder.AddSentry();

// ========================================
// Logging with Serilog
// ========================================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-onboarding-api")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(builder.Configuration["Elasticsearch:Uri"] ?? "http://elasticsearch:9200"))
    {
        IndexFormat = $"{Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-onboarding-api"}-logs-{{0:yyyy.MM.dd}}",
        AutoRegisterTemplate = true,
        AutoRegisterTemplateVersion = AutoRegisterTemplateVersion.ESv7,
        ModifyConnectionSettings = x => x.BasicAuthentication(
            builder.Configuration["Elasticsearch:Username"],
            builder.Configuration["Elasticsearch:Password"])
    })
    .CreateLogger();

builder.Host.UseSerilog();

// ========================================
// Database (PostgreSQL + EF Core)
// ========================================
builder.Services.AddDbContext<OnboardingDbContext>(options =>
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
// Redis (Cache + Idempotency)
// ========================================
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = ConfigurationOptions.Parse(builder.Configuration.GetConnectionString("Redis")!);
    configuration.AbortOnConnectFail = false;
    configuration.ConnectRetry = 5;
    configuration.ConnectTimeout = 10000;
    return ConnectionMultiplexer.Connect(configuration);
});

// ========================================
// Kafka Event Bus
// ========================================
builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection("Kafka"));
builder.Services.AddSingleton<IEventBus, KafkaEventBus>();

// ========================================
// Repositories
// ========================================
builder.Services.AddScoped<IOnboardingCaseRepository, OnboardingCaseRepository>();
builder.Services.AddScoped<OnboardingApi.Application.Commands.IApplicationRepository, OnboardingApi.Infrastructure.Persistence.Repositories.ApplicationRepository>();
builder.Services.AddScoped<OnboardingApi.Application.Commands.IEventPublisher, OnboardingApi.Infrastructure.EventBus.EventPublisherAdapter>();

// ========================================
// HTTP Client Factory
// ========================================
builder.Services.AddHttpClient();

// ========================================
// Current User Service & Organization Mapping
// ========================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, OnboardingApi.Infrastructure.Services.CurrentUser>();
builder.Services.AddScoped<IOrganizationMapper, OnboardingApi.Infrastructure.Services.OrganizationMapper>();

// ========================================
// Entity Configuration Service
// ========================================
builder.Services.AddScoped<OnboardingApi.Infrastructure.Services.IEntityConfigurationService, OnboardingApi.Infrastructure.Services.EntityConfigurationService>();

// Add distributed cache (Redis) for organization mapping cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = $"{Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-onboarding-api"}:";
});

// ========================================
// MediatR + CQRS
// ========================================
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Commands.CreateOnboardingCaseCommand).Assembly);
});

// Pipeline behaviors
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(OnboardingApi.Application.Commands.CreateOnboardingCaseCommand).Assembly);

// Mapster
OnboardingApi.Application.Mapping.MapsterConfig.Configure();
builder.Services.AddSingleton<IMapper>(sp => new MapsterMapper.Mapper(TypeAdapterConfig.GlobalSettings));

// ========================================
// Authentication (Keycloak + Active Directory)
// ========================================
builder.Services.AddAuthenticationServices(builder.Configuration);

// ========================================
// OpenTelemetry (Distributed Tracing)
// ========================================
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService(Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-onboarding-api"))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            // .AddEntityFrameworkCoreInstrumentation() // Commented out for now
            .AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(builder.Configuration["OpenTelemetry:Endpoint"] ?? "http://otel-collector:4317");
                options.Protocol = OtlpExportProtocol.Grpc;
            });
    });

// ========================================
// Controllers + API
// ========================================
builder.Services.AddControllers(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// ========================================
// Swagger / OpenAPI
// ========================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Onboarding API",
        Version = "v1",
        Description = "Corporate Digital Onboarding & KYB API",
        Contact = new OpenApiContact
        {
            Name = "Platform Team",
            Email = "platform@example.com"
        }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "OAuth 2.1 Bearer token via Keycloak"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
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
              .AllowAnyHeader()
              .WithExposedHeaders("X-Request-Id", "ETag", "Last-Modified");
    });
});

// ========================================
// Health Checks
// ========================================
builder.Services.AddHealthChecks()
    .AddDbContextCheck<OnboardingDbContext>();

var app = builder.Build();

// ========================================
// Sentry Middleware
// ========================================
app.UseSentry();

// ========================================
// Middleware Pipeline
// ========================================

// Prometheus metrics
app.UseMetricServer();
app.UseHttpMetrics();

// Trace ID middleware - propagate trace ID across all services
app.Use(async (context, next) =>
{
    // Extract or generate trace ID
    var traceId = context.Request.Headers["X-Trace-Id"].FirstOrDefault() ??
                  context.Request.Headers["x-trace-id"].FirstOrDefault() ??
                  context.Request.Headers["X-Request-Id"].FirstOrDefault() ??
                  Guid.NewGuid().ToString();

    // Set in response headers
    context.Response.Headers["X-Trace-Id"] = traceId;
    context.Response.Headers["X-Request-Id"] = traceId;

    // Set in Activity for OpenTelemetry
    if (System.Diagnostics.Activity.Current != null)
    {
        System.Diagnostics.Activity.Current.SetTag("trace.id", traceId);
        System.Diagnostics.Activity.Current.SetTag("http.trace_id", traceId);
    }

    // Store in context for use in event publishing
    context.Items["TraceId"] = traceId;

    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Onboarding API v1");
    });
}

app.UseCors();
app.UseDevelopmentAuth(); // Enable development authentication for service-to-service calls
app.UseAuthenticationMiddleware();
app.UseMiddleware<OnboardingApi.Presentation.Middleware.PermissionsMiddleware>();
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
var onboardingContext = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
try
{
    await onboardingContext.Database.EnsureCreatedAsync();
    Log.Information("Onboarding database migration completed successfully");
}
catch (Exception ex)
{
    Log.Error(ex, "Onboarding database migration failed: {Error}", ex.Message);
    throw;
}

// ========================================
// Run Application
// ========================================
try
{
    Log.Information("Starting Onboarding API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

