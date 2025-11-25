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
// using Shared.Sentry; // Shared project not referenced - Sentry configured directly below

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Sentry Error Monitoring
// ========================================
// Sentry configuration
var sentryDsn = builder.Configuration["Sentry:Dsn"] ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
if (!string.IsNullOrEmpty(sentryDsn))
{
    builder.WebHost.UseSentry(options =>
    {
        options.Dsn = sentryDsn;
        options.Environment = builder.Environment.EnvironmentName;
        options.TracesSampleRate = builder.Configuration.GetValue<double>("Sentry:TracesSampleRate", 0.1);
    });
}

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
// Audit Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Audit.AuditLogDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("AuditLog:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use audit schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "audit");
        });
});

// ========================================
// Checklist Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Checklist.ChecklistDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("Checklist:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use checklist schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "checklist");
        });
});

// ========================================
// Notification Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Notification.NotificationDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("Notification:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use notification schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "notification");
        });
});

// ========================================
// Messaging Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Messaging.MessagingDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("Messaging:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use messaging schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "messaging");
        });
});

// ========================================
// Entity Configuration Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.EntityConfiguration.EntityConfigurationDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("EntityConfiguration:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use entity_configuration schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "entity_configuration");
        });
});

// ========================================
// Work Queue Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.WorkQueue.WorkQueueDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("WorkQueue:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use work_queue schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "work_queue");
        });
});

// ========================================
// Risk Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Risk.RiskDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("Risk:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use risk schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "risk");
        });
});

// ========================================
// Projections Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Projections.ProjectionsDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("Projections:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use projections schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "projections");
        });
});

// ========================================
// Document Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Document.DocumentDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL") ?? builder.Configuration.GetConnectionString("Document:PostgreSQL"),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
            // Use document schema
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "document");
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
// Audit Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Audit.Interfaces.IAuditLogRepository, OnboardingApi.Infrastructure.Persistence.Audit.AuditLogRepository>();

// ========================================
// Checklist Module Repositories & Services
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Checklist.Interfaces.IChecklistRepository, OnboardingApi.Infrastructure.Persistence.Checklist.ChecklistRepository>();
builder.Services.AddScoped<OnboardingApi.Application.Checklist.Interfaces.IChecklistTemplateService, OnboardingApi.Infrastructure.Services.ChecklistTemplateService>();

// ========================================
// Notification Module Repositories & Services
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.INotificationRepository, OnboardingApi.Infrastructure.Persistence.Notification.NotificationRepository>();
builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.INotificationSender, OnboardingApi.Infrastructure.Services.NotificationSender>();
builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.IEmailSender, OnboardingApi.Infrastructure.Services.EmailSender>();
builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.ISmsSender, OnboardingApi.Infrastructure.Services.SmsSender>();
builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.INotificationService, OnboardingApi.Infrastructure.Services.NotificationServiceImpl>();

// ========================================
// Messaging Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Messaging.Interfaces.IMessageRepository, OnboardingApi.Infrastructure.Persistence.Messaging.MessageRepository>();

// ========================================
// Webhook Module Services
// ========================================
builder.Services.AddHttpClient<OnboardingApi.Application.Webhook.Interfaces.IWebhookDeliveryService, OnboardingApi.Infrastructure.Services.WebhookDeliveryService>();

// ========================================
// Entity Configuration Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.EntityConfiguration.Interfaces.IEntityTypeRepository, OnboardingApi.Infrastructure.Persistence.EntityConfiguration.EntityTypeRepository>();
builder.Services.AddScoped<OnboardingApi.Application.EntityConfiguration.Interfaces.IRequirementRepository, OnboardingApi.Infrastructure.Persistence.EntityConfiguration.RequirementRepository>();
builder.Services.AddScoped<OnboardingApi.Application.EntityConfiguration.Interfaces.IWizardConfigurationRepository, OnboardingApi.Infrastructure.Persistence.EntityConfiguration.WizardConfigurationRepository>();
builder.Services.AddScoped<OnboardingApi.Application.EntityConfiguration.Interfaces.IRoleRepository, OnboardingApi.Infrastructure.Persistence.EntityConfiguration.RoleRepository>();
builder.Services.AddScoped<OnboardingApi.Application.EntityConfiguration.Interfaces.IUserRepository, OnboardingApi.Infrastructure.Persistence.EntityConfiguration.UserRepository>();

// ========================================
// Work Queue Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.WorkQueue.Interfaces.IWorkItemRepository, OnboardingApi.Infrastructure.Persistence.WorkQueue.WorkItemRepository>();

// ========================================
// Risk Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Risk.Interfaces.IRiskAssessmentRepository, OnboardingApi.Infrastructure.Persistence.Risk.RiskAssessmentRepository>();

// ========================================
// Projections Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Projections.Interfaces.IProjectionRepository, OnboardingApi.Infrastructure.Persistence.Projections.ProjectionRepository>();

// ========================================
// Document Module Repositories
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Document.Interfaces.IDocumentRepository, OnboardingApi.Infrastructure.Persistence.Document.DocumentRepository>();

// ========================================
// MinIO Object Storage for Documents
// ========================================
builder.Services.Configure<OnboardingApi.Infrastructure.Storage.MinIOOptions>(builder.Configuration.GetSection("Storage"));
// MinIOObjectStorage now creates and configures the client itself
builder.Services.AddScoped<OnboardingApi.Application.Document.Interfaces.IObjectStorage, OnboardingApi.Infrastructure.Storage.MinIOObjectStorage>();

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
    // Register Audit module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Audit.Commands.CreateAuditLogEntryCommand).Assembly);
    // Register Checklist module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Checklist.Commands.CreateChecklistCommand).Assembly);
    // Register Notification module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Notification.Commands.SendNotificationCommand).Assembly);
    // Register Messaging module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Messaging.Commands.SendMessageCommand).Assembly);
    // Register Entity Configuration module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.EntityConfiguration.Commands.CreateEntityTypeCommand).Assembly);
    // Register Work Queue module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.WorkQueue.Commands.CreateWorkItemCommand).Assembly);
    // Register Risk module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Risk.Commands.CreateRiskAssessmentCommand).Assembly);
    // Register Projections module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Projections.Queries.GetDashboardQuery).Assembly);
    // Register Document module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Document.Commands.UploadDocumentCommand).Assembly);
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
// SignalR for Real-Time Updates
// ========================================
builder.Services.AddSignalR();

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
        // Allow specific origins for local development with credentials
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001") 
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials() // Crucial for SignalR with credentials
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
// Sentry tracing middleware
if (!string.IsNullOrEmpty(builder.Configuration["Sentry:Dsn"] ?? Environment.GetEnvironmentVariable("SENTRY_DSN")))
{
    app.UseSentryTracing();
}

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

// SignalR Hub - Map early to allow WebSocket negotiation (before auth middleware)
app.MapHub<OnboardingApi.Presentation.Hubs.MessagingHub>("/api/v1/messages/hub");

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
// NOTE: Migrations are now handled by the independent OnboardingApi.Migrations project
// Run migrations separately before starting the application:
//   dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
// 
// DO NOT use EnsureCreatedAsync() as it will drop and recreate tables, causing data loss!
// Migrations should be applied using: Database.MigrateAsync() in the migration project
//
// For production deployments, run migrations as a separate step before deploying the application.

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

