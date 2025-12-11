using Sentry;
using Sentry.AspNetCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Shared.Sentry
{
    /// <summary>
    /// Shared Sentry configuration extensions for all services
    /// </summary>
    public static class SentryExtensions
    {
        /// <summary>
        /// Configure Sentry for the application
        /// </summary>
        public static WebApplicationBuilder AddSentry(this WebApplicationBuilder builder)
        {
            var sentryDsn = builder.Configuration["Sentry:Dsn"] 
                ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
            
            var sentryEnabled = builder.Configuration.GetValue<bool>("Sentry:Enabled", true);
            var sentryEnabledEnv = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
            if (sentryEnabledEnv != null)
            {
                sentryEnabled = bool.Parse(sentryEnabledEnv);
            }

            if (!string.IsNullOrEmpty(sentryDsn) && sentryEnabled)
            {
                var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") 
                    ?? builder.Configuration["ServiceName"] 
                    ?? "unknown-service";
                
                var environment = builder.Environment.EnvironmentName;
                var release = Environment.GetEnvironmentVariable("SENTRY_RELEASE") 
                    ?? builder.Configuration["Sentry:Release"] 
                    ?? "unknown";

                builder.WebHost.UseSentry(options =>
                {
                    options.Dsn = sentryDsn;
                    options.Environment = environment;
                    options.Release = release;
                    options.TracesSampleRate = builder.Configuration.GetValue<double>("Sentry:TracesSampleRate", 0.1);
                    options.ProfilesSampleRate = builder.Configuration.GetValue<double>("Sentry:ProfilesSampleRate", 0.1);
                    
                    // Set service name as tag
                    options.SetTag("service", serviceName);
                    
                    // Configure before send to filter sensitive data
                    options.BeforeSend = (sentryEvent) =>
                    {
                        // Remove sensitive headers
                        if (sentryEvent.Request?.Headers != null)
                        {
                            sentryEvent.Request.Headers.Remove("Authorization");
                            sentryEvent.Request.Headers.Remove("Cookie");
                            sentryEvent.Request.Headers.Remove("X-Api-Key");
                        }
                        
                        // Remove sensitive data from context
                        if (sentryEvent.Contexts?.Request?.Headers != null)
                        {
                            sentryEvent.Contexts.Request.Headers.Remove("Authorization");
                            sentryEvent.Contexts.Request.Headers.Remove("Cookie");
                        }
                        
                        return sentryEvent;
                    };
                    
                    // Configure integrations
                    options.AddIntegration(new SentryAspNetCoreIntegration());
                });
            }
            else if (builder.Environment.IsDevelopment())
            {
                builder.Logging.AddConsole();
            }

            return builder;
        }

        /// <summary>
        /// Use Sentry in the application pipeline
        /// </summary>
        public static WebApplication UseSentry(this WebApplication app)
        {
            var sentryDsn = app.Configuration["Sentry:Dsn"] 
                ?? Environment.GetEnvironmentVariable("SENTRY_DSN");
            
            var sentryEnabled = app.Configuration.GetValue<bool>("Sentry:Enabled", true);
            var sentryEnabledEnv = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
            if (sentryEnabledEnv != null)
            {
                sentryEnabled = bool.Parse(sentryEnabledEnv);
            }

            if (!string.IsNullOrEmpty(sentryDsn) && sentryEnabled)
            {
                app.UseSentryTracing();
            }

            return app;
        }

        /// <summary>
        /// Report an exception to Sentry with context
        /// </summary>
        public static void ReportError(
            this ILogger logger,
            Exception exception,
            string? message = null,
            Dictionary<string, object>? extra = null,
            Dictionary<string, string>? tags = null)
        {
            var sentryDsn = Environment.GetEnvironmentVariable("SENTRY_DSN");
            var sentryEnabled = Environment.GetEnvironmentVariable("SENTRY_ENABLED");
            
            if (!string.IsNullOrEmpty(sentryDsn) && 
                (sentryEnabled == null || bool.Parse(sentryEnabled)))
            {
                SentrySdk.WithScope(scope =>
                {
                    if (tags != null)
                    {
                        foreach (var tag in tags)
                        {
                            scope.SetTag(tag.Key, tag.Value);
                        }
                    }
                    
                    if (extra != null)
                    {
                        foreach (var item in extra)
                        {
                            scope.SetExtra(item.Key, item.Value);
                        }
                    }
                    
                    if (!string.IsNullOrEmpty(message))
                    {
                        scope.SetTag("error_message", message);
                    }
                    
                    SentrySdk.CaptureException(exception);
                });
            }
            
            // Always log to standard logger as well
            if (!string.IsNullOrEmpty(message))
            {
                logger.LogError(exception, message);
            }
            else
            {
                logger.LogError(exception, "An error occurred");
            }
        }
    }
}

