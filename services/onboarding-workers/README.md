# Onboarding Workers Service

Unified background worker service that consolidates all background processing jobs.

## What's Included

- **OutboxRelayWorker**: Reliably publishes outbox events to Kafka (from `outbox-relay` service)
- **ComplianceRefreshWorker**: Scheduled job for compliance refreshes (from `compliance-refresh-job`)

## Configuration

See `appsettings.json` for configuration options. Environment variables are also supported:

- `ConnectionStrings__PostgreSQL`: PostgreSQL connection string
- `ConnectionStrings__Redis`: Redis connection string
- `Kafka__BootstrapServers`: Kafka broker address
- `OutboxRelay__BatchSize`: Number of events to process per batch (default: 100)
- `OutboxRelay__PollIntervalMs`: Polling interval in milliseconds (default: 1000)
- `ComplianceRefresh__DistributedLockKey`: Redis key for distributed lock
- `ComplianceRefresh__BatchSize`: Number of cases to process per run (default: 100)
- `ComplianceRefresh__DryRun`: Enable dry-run mode (default: false)
- `ComplianceRefresh__RunIntervalHours`: Hours between compliance refresh runs (default: 24)

## Running Locally

```bash
cd services/onboarding-workers
dotnet run
```

## Docker

```bash
docker build -t onboarding-workers .
docker run -e ConnectionStrings__PostgreSQL="Host=localhost;..." onboarding-workers
```

## Adding New Workers

To add a new background worker:

1. Create a new class in `src/Workers/` that implements `BackgroundService`
2. Register it in `Program.cs`:
   ```csharp
   builder.Services.AddHostedService<YourNewWorker>();
   ```

## Migration from Old Services

This service replaces:
- `outbox-relay` service
- `compliance-refresh-job` (standalone script)

The old services can be decommissioned once this is running in production.

