using OutboxRelay;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "outbox-relay")
    .WriteTo.Console()
    .CreateLogger();

builder.Services.AddSerilog();

// Add background worker
builder.Services.AddHostedService<OutboxRelayWorker>();

var host = builder.Build();
host.Run();

