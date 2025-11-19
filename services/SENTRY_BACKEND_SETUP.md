# Sentry Backend Integration Guide

This document describes how Sentry has been integrated into the backend C# services and how to complete the integration for remaining services.

## Completed Services

The following services have been fully integrated with Sentry:
- ✅ `onboarding-api` - Full integration with exception filter
- ✅ `entity-configuration-service` - Full integration with error handler
- ✅ `risk-service` - Full integration
- ✅ `document-service` - Full integration

## Remaining Services

The following services still need Sentry integration:
- `auditlog-service`
- `authentication-service`
- `checklist-service`
- `compliance-refresh-job`
- `messaging-service`
- `notification-service`
- `outbox-relay`
- `projections-api`
- `webhook-dispatcher`
- `work-queue-service`

## Integration Steps

For each remaining service, follow these steps:

### 1. Add Sentry NuGet Package

Add to the Presentation layer `.csproj` file (or main `.csproj` if no Presentation layer):

```xml
<PackageReference Include="Sentry.AspNetCore" Version="4.9.0" />
```

### 2. Configure Sentry in Program.cs

Add at the top of `Program.cs` (after other using statements):

```csharp
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
    var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "your-service-name";
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
```

### 3. Add Sentry Middleware

In the middleware pipeline (after `var app = builder.Build();`):

```csharp
// Sentry middleware
var sentryDsnApp = app.Configuration["Sentry:Dsn"] ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
var sentryEnabledApp = app.Configuration.GetValue<bool>("Sentry:Enabled", true);
var sentryEnabledEnvApp = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
if (sentryEnabledEnvApp != null) sentryEnabledApp = bool.Parse(sentryEnabledEnvApp);
if (!string.IsNullOrEmpty(sentryDsnApp) && sentryEnabledApp)
{
    app.UseSentryTracing();
}
```

### 4. Update Exception Handlers

If the service has a global exception handler or filter, add Sentry reporting:

```csharp
using Sentry;

// In exception handler:
SentrySdk.WithScope(scope =>
{
    scope.SetTag("endpoint", context.Request.Path);
    scope.SetTag("method", context.Request.Method);
    scope.SetTag("exception_type", exception.GetType().Name);
    scope.SetExtra("user", context.User?.Identity?.Name ?? "anonymous");
    SentrySdk.CaptureException(exception);
});
```

### 5. Update Try-Catch Blocks

Replace `Console.WriteLine` or `logger.LogError` in critical catch blocks with Sentry:

```csharp
catch (Exception ex)
{
    logger.LogError(ex, "Error message");
    SentrySdk.CaptureException(ex); // Add this
}
```

## Configuration

Add to `appsettings.json`:

```json
{
  "Sentry": {
    "Dsn": "YOUR_SENTRY_DSN",
    "Enabled": true,
    "TracesSampleRate": 0.1
  }
}
```

Or use environment variables:
- `SENTRY_DSN` - Your Sentry DSN
- `SENTRY_ENABLED` - `true` or `false` (default: `true`)
- `SENTRY_RELEASE` - Release version (optional)
- `SERVICE_NAME` - Service name for tagging

## Shared Helper (Optional)

A shared helper class is available at `services/shared/SentryExtensions.cs` but requires a shared project reference. For now, services use inline configuration as shown above.

## Testing

1. Set `SENTRY_DSN` environment variable
2. Set `SENTRY_ENABLED=true`
3. Trigger an error in the service
4. Check Sentry dashboard for the error

## Notes

- Sentry will automatically capture unhandled exceptions
- Use `SentrySdk.CaptureException()` for manual reporting in catch blocks
- Sentry respects the `SENTRY_ENABLED` flag - set to `false` to disable
- In development, errors still log to console/Serilog even if Sentry is disabled

