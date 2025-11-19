using OnboardingWorkers.Workers;
using Serilog;
using StackExchange.Redis;

var builder = Host.CreateApplicationBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "onboarding-workers")
    .WriteTo.Console()
    .CreateLogger();

builder.Services.AddSerilog();

// Configure Redis for distributed locking
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") 
    ?? builder.Configuration["ConnectionStrings:Redis"] 
    ?? "localhost:6379";

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConnectionString));

// Register background workers
builder.Services.AddHostedService<OutboxRelayWorker>();
builder.Services.AddHostedService<ComplianceRefreshWorker>();

var host = builder.Build();

try
{
    Log.Information("Onboarding Workers service starting...");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Onboarding Workers service terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

