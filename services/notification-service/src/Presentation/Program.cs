using NotificationService.Application.Interfaces;
using NotificationService.Infrastructure.Persistence;
using NotificationService.Infrastructure.Repositories;
using NotificationService.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Npgsql;
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
    .Enrich.WithProperty("Service", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "kyb-notification-api")
    .CreateLogger();

builder.Host.UseSerilog();

// ========================================
// Controllers & API
// ========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "KYB Notification API", Version = "v1" });
    
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
// Configure Npgsql with dynamic JSON enabled for jsonb mapping of Dictionary<string, object>
var notificationsConnectionString = builder.Configuration.GetConnectionString("PostgreSQL");
builder.Services.AddSingleton(provider =>
{
    var dataSourceBuilder = new NpgsqlDataSourceBuilder(notificationsConnectionString);
    dataSourceBuilder.EnableDynamicJson();
    return dataSourceBuilder.Build();
});

builder.Services.AddDbContext<NotificationDbContext>((sp, options) =>
{
    var dataSource = sp.GetRequiredService<NpgsqlDataSource>();
    options.UseNpgsql(
        dataSource,
        npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        });
});

// ========================================
// Repositories & Services
// ========================================
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<NotificationService.Application.Interfaces.INotificationTemplateRepository, NotificationTemplateRepository>();
builder.Services.AddScoped<INotificationSender, NotificationSender>();
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.AddScoped<ISmsSender, SmsSender>();

// ========================================
// MediatR + CQRS
// ========================================
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(NotificationService.Application.Commands.SendNotificationCommand).Assembly);
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
    .AddDbContextCheck<NotificationDbContext>();

var app = builder.Build();

// ========================================
// Database Migration
// ========================================
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
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
            
            // Create notification_templates table if it doesn't exist
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS notification_templates (
                        id uuid PRIMARY KEY,
                        name varchar(200) NOT NULL,
                        description varchar(1000) NOT NULL,
                        type text NOT NULL,
                        channel text NOT NULL,
                        subject varchar(500) NOT NULL,
                        content text NOT NULL,
                        recipients text,
                        trigger varchar(200) NOT NULL,
                        priority text NOT NULL,
                        is_active boolean NOT NULL,
                        frequency text NOT NULL,
                        created_at timestamptz NOT NULL,
                        updated_at timestamptz NOT NULL,
                        created_by varchar(200)
                    );
                    CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);
                    CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
                    CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);
                ");
                Log.Information("Notification templates table created successfully");
            }
            catch (Exception ex)
            {
                // Table might already exist, ignore
                Log.Debug("Notification templates table creation: {Message}", ex.Message);
            }
            
            Log.Information("Database tables ensured/created successfully");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed. Service will continue but database operations may fail.");
        // Don't throw - allow service to start even if DB setup fails
    }
}

// ========================================
// Middleware Pipeline
// ========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notification Service API v1");
        c.RoutePrefix = string.Empty;
    });
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
    var context = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        // Safety net: explicitly create table if EnsureCreated missed it
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS notifications (
                id uuid PRIMARY KEY,
                type text NOT NULL,
                channel text NOT NULL,
                recipient varchar(200) NOT NULL,
                subject varchar(500) NOT NULL,
                content text NOT NULL,
                status text NOT NULL,
                priority text NOT NULL,
                case_id varchar(100),
                partner_id varchar(100),
                template_id varchar(100),
                template_data jsonb,
                created_at timestamptz NOT NULL,
                scheduled_at timestamptz,
                sent_at timestamptz,
                delivered_at timestamptz,
                failed_at timestamptz,
                error_message varchar(2000),
                retry_count int NOT NULL,
                max_retries int NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
            CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
            CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON notifications(case_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_partner_id ON notifications(partner_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
            CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
        ");
        Log.Information("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database migration failed");
        throw;
    }
}

Log.Information("Notification Service starting up...");

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
