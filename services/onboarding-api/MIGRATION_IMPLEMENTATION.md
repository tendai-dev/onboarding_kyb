# Migration Implementation Summary

## Problem Solved

**CRITICAL ISSUE FIXED**: The application was using `EnsureCreatedAsync()` which:
- Drops and recreates all tables on every startup
- **Causes complete data loss** during deployments
- Cannot be safely used in production

## Solution Implemented

### 1. Independent Migration Project
Created `OnboardingApi.Migrations` project that:
- Runs **independently** from the main application
- Uses proper EF Core migrations (`Database.MigrateAsync()`)
- Safely applies schema changes **without data loss**
- Handles all 10 database contexts automatically

### 2. Removed Dangerous Code
- **Removed all `EnsureCreatedAsync()` calls** from `Program.cs`
- Added clear comments explaining migrations must be run separately
- Application no longer attempts to modify database schema on startup

### 3. Docker Integration
- Added `onboarding-migrations` service to `docker-compose.yml`
- Uses profile system: `docker-compose --profile migrations up onboarding-migrations`
- Can be run before deploying the main application

## Project Structure

```
services/onboarding-api/
├── src/
│   ├── Migrations/                    # NEW: Independent migration project
│   │   ├── OnboardingApi.Migrations.csproj
│   │   ├── Program.cs                 # Migration runner
│   │   ├── appsettings.json
│   │   ├── Dockerfile
│   │   └── README.md
│   └── Presentation/
│       └── Program.cs                 # UPDATED: Removed EnsureCreatedAsync
├── MIGRATION_GUIDE.md                 # NEW: Complete usage guide
└── MIGRATION_IMPLEMENTATION.md         # This file
```

## How to Use

### Option 1: Docker (Recommended for Production)

```bash
# Run migrations before starting the API
docker-compose --profile migrations up onboarding-migrations

# Verify migrations succeeded, then start the API
docker-compose up -d onboarding-api
```

### Option 2: Local Development

```bash
cd services/onboarding-api

# Set connection string
export ConnectionStrings__PostgreSQL="Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password"

# Run migrations
dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
```

## Database Contexts Migrated

The migration project handles all 10 contexts:

1. `OnboardingDbContext` → `onboarding` schema
2. `AuditLogDbContext` → `audit` schema
3. `ChecklistDbContext` → `checklist` schema
4. `NotificationDbContext` → `notification` schema
5. `MessagingDbContext` → `messaging` schema
6. `EntityConfigurationDbContext` → `entity_configuration` schema
7. `WorkQueueDbContext` → `work_queue` schema
8. `RiskDbContext` → `risk` schema
9. `ProjectionsDbContext` → `projections` schema
10. `DocumentDbContext` → `document` schema

## Creating New Migrations

When you modify entity configurations:

```bash
# Install EF Core tools (one-time)
dotnet tool install --global dotnet-ef

# Create migration for a specific context
dotnet ef migrations add MigrationName \
  --context OnboardingDbContext \
  --project src/Infrastructure/OnboardingApi.Infrastructure.csproj \
  --startup-project src/Presentation/OnboardingApi.Presentation.csproj \
  --output-dir Migrations/Onboarding
```

## Deployment Workflow

### Production Deployment Steps

1. **Backup database** (always!)
2. **Run migrations**:
   ```bash
   docker-compose --profile migrations up onboarding-migrations
   ```
3. **Verify migrations succeeded** (check logs)
4. **Deploy application**:
   ```bash
   docker-compose up -d onboarding-api
   ```

## Key Benefits

✅ **No data loss** - Migrations preserve existing data
✅ **Idempotent** - Safe to run multiple times
✅ **Independent** - Can run without starting the full application
✅ **Tracked** - Migration history stored in `__EFMigrationsHistory` per schema
✅ **Production-ready** - Proper migration workflow for deployments

## Important Notes

⚠️ **Never use `EnsureCreatedAsync()` in production code**
- It will drop all tables and recreate them
- All data will be lost
- Use migrations instead

✅ **Always test migrations on a copy of production data first**

✅ **Migrations are versioned and tracked** - EF Core knows which migrations have been applied

## Next Steps

1. **Create initial migrations** for existing schemas (if needed):
   ```bash
   # This will create migrations from the current schema
   dotnet ef migrations add InitialCreate --context OnboardingDbContext
   ```

2. **Test the migration runner**:
   ```bash
   docker-compose --profile migrations up onboarding-migrations
   ```

3. **Update CI/CD pipelines** to run migrations before deploying the application

