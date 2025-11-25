# Database Migrations

This project provides an independent migration runner for all database contexts in the onboarding-api service.

## Purpose

**CRITICAL**: The main application no longer uses `EnsureCreatedAsync()` which would drop and recreate tables, causing data loss. Migrations must be run separately using this project.

## Usage

### Local Development

```bash
# Set connection string via environment variable
export ConnectionStrings__PostgreSQL="Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password"

# Run migrations
dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
```

### Docker/Production

```bash
# Build the migration project
dotnet build src/Migrations/OnboardingApi.Migrations.csproj

# Run migrations with connection string
ConnectionStrings__PostgreSQL="Host=postgres;Database=kyb_case;Username=kyb;Password=kyb_password" \
  dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
```

### Creating New Migrations

To create a new migration for a specific DbContext:

```bash
# For OnboardingDbContext
dotnet ef migrations add MigrationName \
  --context OnboardingDbContext \
  --project src/Infrastructure/OnboardingApi.Infrastructure.csproj \
  --startup-project src/Presentation/OnboardingApi.Presentation.csproj \
  --output-dir Migrations/Onboarding

# For other contexts, replace OnboardingDbContext with:
# - AuditLogDbContext
# - ChecklistDbContext
# - NotificationDbContext
# - MessagingDbContext
# - EntityConfigurationDbContext
# - WorkQueueDbContext
# - RiskDbContext
# - ProjectionsDbContext
# - DocumentDbContext
```

## What This Project Does

1. Connects to the PostgreSQL database
2. Applies pending migrations for all 10 database contexts:
   - `onboarding` schema (OnboardingDbContext)
   - `audit` schema (AuditLogDbContext)
   - `checklist` schema (ChecklistDbContext)
   - `notification` schema (NotificationDbContext)
   - `messaging` schema (MessagingDbContext)
   - `entity_configuration` schema (EntityConfigurationDbContext)
   - `work_queue` schema (WorkQueueDbContext)
   - `risk` schema (RiskDbContext)
   - `projections` schema (ProjectionsDbContext)
   - `document` schema (DocumentDbContext)

3. Uses `Database.MigrateAsync()` which safely applies migrations without data loss

## Deployment Workflow

1. **Before deploying the application:**
   ```bash
   # Run migrations first
   dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
   ```

2. **Then deploy/start the application:**
   ```bash
   docker-compose up -d onboarding-api
   ```

## Important Notes

- Migrations are **idempotent** - safe to run multiple times
- Migrations track applied changes in `__EFMigrationsHistory` table per schema
- Never use `EnsureCreatedAsync()` or `EnsureDeletedAsync()` in production code
- Always test migrations on a copy of production data first

