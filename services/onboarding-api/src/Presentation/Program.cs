using FluentValidation;
using Mapster;
using MapsterMapper;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
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
using Npgsql;
// using Shared.Sentry; // Shared project not referenced - Sentry configured directly below

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Strongly-Typed Configuration
// ========================================
builder.Services.Configure<OnboardingApi.Application.Configuration.ServicesOptions>(
    builder.Configuration.GetSection(OnboardingApi.Application.Configuration.ServicesOptions.SectionName));
builder.Services.Configure<OnboardingApi.Application.Configuration.SendGridOptions>(
    builder.Configuration.GetSection(OnboardingApi.Application.Configuration.SendGridOptions.SectionName));
builder.Services.Configure<OnboardingApi.Application.Configuration.SecurityOptions>(
    builder.Configuration.GetSection(OnboardingApi.Application.Configuration.SecurityOptions.SectionName));

// ========================================
// Security: Configure PartnerIdGenerator Salt
// ========================================
// IMPORTANT: Set PARTNER_ID_SALT environment variable in production
// Changing this salt will invalidate all existing partner IDs
var partnerIdSalt = builder.Configuration["Security:PartnerIdSalt"] 
    ?? Environment.GetEnvironmentVariable("PARTNER_ID_SALT");
OnboardingApi.Infrastructure.Utilities.PartnerIdGenerator.ConfigureSalt(partnerIdSalt);

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
// Logging with Serilog (Optimized for reduced storage costs)
// ========================================
// Log sampling configuration - reduces ~100GB/day to ~25GB/day
var debugSamplePercent = builder.Configuration.GetValue("Logging:DebugSamplePercent", 10);
var verboseSamplePercent = builder.Configuration.GetValue("Logging:VerboseSamplePercent", 5);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Hosting", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Routing", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Mvc", LogEventLevel.Warning)
    .MinimumLevel.Override("System.Net.Http.HttpClient", LogEventLevel.Warning)
    .MinimumLevel.Override("HealthChecks", LogEventLevel.Warning)
    // Apply log sampling to reduce Debug/Verbose volume by 90%+
    .Filter.With(new OnboardingApi.Infrastructure.Logging.LogSamplingFilter(
        debugSamplePercent, verboseSamplePercent))
    // Filter out high-frequency health check and metrics logs
    .Filter.With(new OnboardingApi.Infrastructure.Logging.HighFrequencyLogFilter())
    // Rate limit repeated errors to prevent log flooding
    .Filter.With(new OnboardingApi.Infrastructure.Logging.RateLimitedLogFilter(5))
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-onboarding-api")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(builder.Configuration["Elasticsearch:Uri"] ?? "http://elasticsearch:9200"))
    {
        // Index format compatible with ILM policy (see Infrastructure/Logging/ElasticsearchIlmPolicy.json)
        IndexFormat = $"{Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-onboarding-api"}-logs-{{0:yyyy.MM.dd}}",
        AutoRegisterTemplate = true,
        AutoRegisterTemplateVersion = AutoRegisterTemplateVersion.ESv7,
        // Batch settings to reduce Elasticsearch load
        BatchPostingLimit = 50,
        Period = TimeSpan.FromSeconds(2),
        ModifyConnectionSettings = x => x.BasicAuthentication(
            builder.Configuration["Elasticsearch:Username"],
            builder.Configuration["Elasticsearch:Password"])
    })
    .CreateLogger();

Log.Information(
    "Logging configured with sampling: Debug={DebugPercent}%, Verbose={VerbosePercent}%",
    debugSamplePercent, verboseSamplePercent);

builder.Host.UseSerilog();

// ========================================
// Npgsql Configuration - Enable Dynamic JSON for Dictionary<string, object>
// ========================================
// Enable dynamic JSON serialization for Dictionary<string, object> to JSONB columns
// This is required for Npgsql 8.0+ when saving Dictionary types to JSONB
// For Npgsql 8.0+, we configure it per data source in the UseNpgsql options
// See NotificationDbContext configuration below for the implementation

// ========================================
// Database (PostgreSQL + EF Core)
// ========================================
// OPTIMIZATION: Create shared NpgsqlDataSource to prevent connection pool exhaustion
// With 11 DbContexts, each creating its own pool would mean 11x connections
// Connection pool settings are configured in the connection string:
// - Maximum Pool Size: 100 (shared across all DbContexts)
// - Minimum Pool Size: 5 (keep warm connections ready)
// - Connection Idle Lifetime: 300s (release idle connections after 5 min)
// - Connection Pruning Interval: 10s (check for idle connections frequently)
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL") 
    ?? throw new InvalidOperationException("PostgreSQL connection string is required");

// Append optimized pool settings if not already present
var poolSettings = new Dictionary<string, string>
{
    ["Maximum Pool Size"] = "100",
    ["Minimum Pool Size"] = "5",
    ["Connection Idle Lifetime"] = "300",
    ["Connection Pruning Interval"] = "10",
    ["Timeout"] = "15",  // Connection timeout in seconds
    ["Command Timeout"] = "30"  // Command timeout in seconds
};

var connStringBuilder = new NpgsqlConnectionStringBuilder(connectionString);
foreach (var setting in poolSettings)
{
    // Only set if not already configured
    if (!connectionString.Contains(setting.Key, StringComparison.OrdinalIgnoreCase))
    {
        switch (setting.Key)
        {
            case "Maximum Pool Size": connStringBuilder.MaxPoolSize = int.Parse(setting.Value); break;
            case "Minimum Pool Size": connStringBuilder.MinPoolSize = int.Parse(setting.Value); break;
            case "Connection Idle Lifetime": connStringBuilder.ConnectionIdleLifetime = int.Parse(setting.Value); break;
            case "Connection Pruning Interval": connStringBuilder.ConnectionPruningInterval = int.Parse(setting.Value); break;
            case "Timeout": connStringBuilder.Timeout = int.Parse(setting.Value); break;
            case "Command Timeout": connStringBuilder.CommandTimeout = int.Parse(setting.Value); break;
        }
    }
}

var dataSourceBuilder = new NpgsqlDataSourceBuilder(connStringBuilder.ConnectionString);
dataSourceBuilder.EnableDynamicJson(); // Required for Dictionary<string, object> columns
var sharedDataSource = dataSourceBuilder.Build();
builder.Services.AddSingleton(sharedDataSource);

Log.Information(
    "Database connection pool configured: MaxPoolSize={MaxPool}, MinPoolSize={MinPool}, Timeout={Timeout}s",
    connStringBuilder.MaxPoolSize, connStringBuilder.MinPoolSize, connStringBuilder.Timeout);

builder.Services.AddDbContext<OnboardingDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            // OPTIMIZED: Reduced retries from 5 to 2 to prevent connection exhaustion
            // With 11 DbContexts, 5 retries = 5x connection pressure during failures
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
        });
    // Suppress ManyServiceProvidersCreatedWarning - this is expected with multiple DbContexts
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Audit Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Audit.AuditLogDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "audit");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Checklist Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Checklist.ChecklistDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "checklist");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Notification Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Notification.NotificationDbContext>((sp, options) =>
{
    options.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>(), npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 2,
            maxRetryDelay: TimeSpan.FromSeconds(3),
            errorCodesToAdd: null);
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "notification");
    });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Messaging Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Messaging.MessagingDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "messaging");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Entity Configuration Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.EntityConfiguration.EntityConfigurationDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "entity_configuration");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Work Queue Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.WorkQueue.WorkQueueDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "work_queue");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Risk Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Risk.RiskDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "risk");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Projections Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Projections.ProjectionsDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "projections");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
});

// ========================================
// Document Module Database Context
// ========================================
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Persistence.Document.DocumentDbContext>((sp, options) =>
{
    options.UseNpgsql(
        sp.GetRequiredService<NpgsqlDataSource>(),
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 2,
                maxRetryDelay: TimeSpan.FromSeconds(3),
                errorCodesToAdd: null);
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "document");
        });
    options.ConfigureWarnings(w => w.Ignore(CoreEventId.ManyServiceProvidersCreatedWarning));
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
// Cache Metrics and Health Monitoring
// ========================================
builder.Services.AddSingleton<OnboardingApi.Infrastructure.Caching.ICacheMetrics, 
    OnboardingApi.Infrastructure.Caching.CacheMetrics>();
builder.Services.AddHostedService<OnboardingApi.Infrastructure.Caching.CacheHealthMonitorService>();

// ========================================
// Connection Pool Monitoring
// ========================================
builder.Services.AddSingleton<OnboardingApi.Infrastructure.Monitoring.IConnectionPoolMonitor, 
    OnboardingApi.Infrastructure.Monitoring.ConnectionPoolMonitor>();
builder.Services.AddHostedService<OnboardingApi.Infrastructure.Monitoring.ConnectionPoolHealthService>();

// ========================================
// Event Bus (In-Memory, no Kafka)
// ========================================
builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();

// ========================================
// Cross-Schema Transaction Support
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Interfaces.ICrossSchemaTransactionFactory, 
    OnboardingApi.Infrastructure.Persistence.CrossSchemaTransactionFactory>();

// ========================================
// Data Integrity Service
// ========================================
builder.Services.AddScoped<OnboardingApi.Infrastructure.Services.IDataIntegrityService, 
    OnboardingApi.Infrastructure.Services.DataIntegrityService>();

// ========================================
// Domain Event Dispatcher (Async Event Processing)
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Interfaces.IDomainEventDispatcher, 
    OnboardingApi.Infrastructure.EventBus.DomainEventDispatcher>();

// ========================================
// Outbox Event Processor (Background Service)
// ========================================
builder.Services.AddHostedService<OnboardingApi.Infrastructure.EventBus.OutboxEventProcessor>();

// ========================================
// Projection Sync Service (Background Service with Retry)
// ========================================
builder.Services.AddHostedService<OnboardingApi.Infrastructure.BackgroundServices.ProjectionSyncService>();

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
// Logging & Metrics Services
// ========================================
builder.Services.AddSingleton<OnboardingApi.Infrastructure.Logging.IStateTransitionLogger, 
    OnboardingApi.Infrastructure.Logging.StateTransitionLogger>();
builder.Services.AddSingleton<OnboardingApi.Infrastructure.Logging.IOperationMetrics, 
    OnboardingApi.Infrastructure.Logging.OperationMetrics>();

// Audit log retention service (monthly partition management + 7-year retention)
builder.Services.AddHostedService<OnboardingApi.Infrastructure.BackgroundServices.AuditLogRetentionService>();

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

// Email Dead Letter Queue for failed email retry
builder.Services.AddDbContext<OnboardingApi.Infrastructure.Services.EmailQueueDbContext>(options =>
    options.UseNpgsql(sharedDataSource));
builder.Services.AddScoped<OnboardingApi.Infrastructure.Services.IEmailDeadLetterQueue, OnboardingApi.Infrastructure.Services.EmailDeadLetterQueue>();

// Email Sender with resilience (retry, circuit breaker, dead letter queue)
builder.Services.AddScoped<OnboardingApi.Infrastructure.Services.SendGridEmailSender>();
var sendGridApiKey = builder.Configuration["SendGrid:ApiKey"] ?? builder.Configuration["SENDGRID_API_KEY"];
if (!string.IsNullOrWhiteSpace(sendGridApiKey))
{
    // Use resilient email sender that wraps SendGrid with retry policies
    builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.IEmailSender, OnboardingApi.Infrastructure.Services.ResilientEmailSender>();
}
else
{
    builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.IEmailSender, OnboardingApi.Infrastructure.Services.EmailSender>();
}

// Background service to retry failed emails
builder.Services.AddHostedService<OnboardingApi.Infrastructure.BackgroundServices.EmailRetryService>();

builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.ISmsSender, OnboardingApi.Infrastructure.Services.SmsSender>();
builder.Services.AddScoped<OnboardingApi.Application.Notification.Interfaces.INotificationService, OnboardingApi.Infrastructure.Services.NotificationServiceImpl>();

// ========================================
// Messaging Module Repositories & Services
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Messaging.Interfaces.IMessageRepository, OnboardingApi.Infrastructure.Persistence.Messaging.MessageRepository>();
builder.Services.AddScoped<OnboardingApi.Application.Messaging.Interfaces.IMessageBroadcaster, OnboardingApi.Presentation.Services.MessageBroadcaster>();

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
builder.Services.AddScoped<OnboardingApi.Application.EntityConfiguration.Interfaces.ICountryConfigurationRepository, OnboardingApi.Infrastructure.Persistence.EntityConfiguration.CountryConfigurationRepository>();

// ========================================
// Rule Engine Service
// ========================================
builder.Services.AddScoped<OnboardingApi.Infrastructure.RuleEngine.IConfigurationRuleEngine, OnboardingApi.Infrastructure.RuleEngine.ConfigurationRuleEngine>();

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
builder.Services.AddScoped<OnboardingApi.Application.Cases.Interfaces.IEntityConfigurationService, OnboardingApi.Infrastructure.Services.EntityConfigurationServiceAdapter>();

// ========================================
// Saga Pattern - Cross-Module Transaction Coordination
// ========================================
builder.Services.AddScoped<OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga.Steps.CreateCaseStep>();
builder.Services.AddScoped<OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga.Steps.CreateWorkItemStep>();
builder.Services.AddScoped<OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga.OnboardingCaseSubmissionOrchestrator>();

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
    // Register Country Configuration handlers (same assembly)
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.EntityConfiguration.Commands.CreateCountryProfileCommand).Assembly);
    // Register Work Queue module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.WorkQueue.Commands.CreateWorkItemCommand).Assembly);
    // Register Risk module handlers
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Application.Risk.Commands.CreateRiskAssessmentCommand).Assembly);
    // Register EDD Signature handlers from Infrastructure layer
    cfg.RegisterServicesFromAssembly(typeof(OnboardingApi.Infrastructure.Persistence.Risk.GetEddSignaturesQueryHandler).Assembly);
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
// Request Size Limits - SECURITY: Prevent DoS attacks
// ========================================
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB for file uploads
    options.ValueLengthLimit = 10 * 1024 * 1024;
    options.MultipartHeadersLengthLimit = 1024;
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
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true; // Allow both camelCase and snake_case
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

// SECURITY: Add security headers middleware (early in pipeline)
app.UseMiddleware<OnboardingApi.Presentation.Middleware.SecurityHeadersMiddleware>();

// Correlation ID middleware - ensures every request has a correlation ID for distributed tracing
app.UseCorrelationId();

// Request/Response logging middleware - logs all API calls with performance metrics
app.UseRequestLogging();

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

// Make Program class accessible for integration tests
public partial class Program { }
