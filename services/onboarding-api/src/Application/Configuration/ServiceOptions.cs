namespace OnboardingApi.Application.Configuration;

/// <summary>
/// Strongly-typed configuration for external services
/// </summary>
public class ServicesOptions
{
    public const string SectionName = "Services";
    
    public ServiceEndpoint Checklist { get; set; } = new();
    public ServiceEndpoint Risk { get; set; } = new();
    public ServiceEndpoint Notification { get; set; } = new();
    public ServiceEndpoint Projections { get; set; } = new();
    public ServiceEndpoint EntityConfiguration { get; set; } = new();
}

public class ServiceEndpoint
{
    public string BaseUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
    public int RetryCount { get; set; } = 3;
}

/// <summary>
/// Strongly-typed configuration for SendGrid email service
/// </summary>
public class SendGridOptions
{
    public const string SectionName = "SendGrid";
    
    public string ApiKey { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
}

/// <summary>
/// Strongly-typed configuration for security settings
/// </summary>
public class SecurityOptions
{
    public const string SectionName = "Security";
    
    public string DeleteAllConfirmationToken { get; set; } = string.Empty;
    public string PartnerIdSalt { get; set; } = string.Empty;
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
}

/// <summary>
/// Strongly-typed configuration for Sentry error monitoring
/// </summary>
public class SentryOptions
{
    public const string SectionName = "Sentry";
    
    public string Dsn { get; set; } = string.Empty;
    public double TracesSampleRate { get; set; } = 0.1;
}

/// <summary>
/// Strongly-typed configuration for database connections
/// </summary>
public class DatabaseOptions
{
    public const string SectionName = "ConnectionStrings";
    
    public string OnboardingDb { get; set; } = string.Empty;
    public string WorkQueueDb { get; set; } = string.Empty;
    public string EntityConfigDb { get; set; } = string.Empty;
}

/// <summary>
/// Strongly-typed configuration for Redis cache
/// </summary>
public class RedisOptions
{
    public const string SectionName = "Redis";
    
    public string ConnectionString { get; set; } = string.Empty;
    public string InstanceName { get; set; } = "onboarding:";
    public int DefaultExpirationMinutes { get; set; } = 60;
}
