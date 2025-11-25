# Database Migration Guide

## Problem Statement

The application previously used `EnsureCreatedAsync()` which:
- **Drops and recreates tables** on every startup
- **Causes complete data loss** during deployments
- **Cannot be used in production**

## Solution

An independent migration project (`OnboardingApi.Migrations`) has been created that:
- Uses proper EF Core migrations (`Database.MigrateAsync()`)
- Can be run separately from the application
- Safely applies schema changes without data loss
- Tracks migration history per schema

## Migration Project Structure

```
services/onboarding-api/src/Migrations/
├── OnboardingApi.Migrations.csproj  # Migration runner project
├── Program.cs                        # Main migration logic
├── appsettings.json                 # Configuration
├── Dockerfile                        # Container for running migrations
└── README.md                         # Detailed usage instructions
```

## Quick Start

### Local Development

```bash
cd services/onboarding-api

# Set connection string
export ConnectionStrings__PostgreSQL="Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password"

# Run migrations
dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
```

### Docker/Production

```bash
# Run migrations before starting the API
docker-compose --profile migrations up onboarding-migrations

# Then start the API
docker-compose up -d onboarding-api
```

## Creating New Migrations

When you modify entity configurations, create migrations:

```bash
# Install EF Core tools (one-time)
dotnet tool install --global dotnet-ef

# Create migration for a specific context
dotnet ef migrations add AddNewColumn \
  --context OnboardingDbContext \
  --project src/Infrastructure/OnboardingApi.Infrastructure.csproj \
  --startup-project src/Presentation/OnboardingApi.Presentation.csproj \
  --output-dir Migrations/Onboarding
```

## Database Contexts

The migration project handles 10 separate database contexts:

1. **OnboardingDbContext** → `onboarding` schema
2. **AuditLogDbContext** → `audit` schema
3. **ChecklistDbContext** → `checklist` schema
4. **NotificationDbContext** → `notification` schema
5. **MessagingDbContext** → `messaging` schema
6. **EntityConfigurationDbContext** → `entity_configuration` schema
7. **WorkQueueDbContext** → `work_queue` schema
8. **RiskDbContext** → `risk` schema
9. **ProjectionsDbContext** → `projections` schema
10. **DocumentDbContext** → `document` schema

## Deployment Workflow

### Recommended Production Workflow

1. **Backup database** (always!)
2. **Run migrations**:
   ```bash
   docker-compose --profile migrations up onboarding-migrations
   ```
3. **Verify migrations succeeded**
4. **Deploy/start application**:
   ```bash
   docker-compose up -d onboarding-api
   ```

### CI/CD Integration

Add migration step to your deployment pipeline:

```yaml
# Example GitHub Actions / GitLab CI
- name: Run Database Migrations
  run: |
    docker-compose --profile migrations up onboarding-migrations
  env:
    ConnectionStrings__PostgreSQL: ${{ secrets.DATABASE_CONNECTION_STRING }}
```

## Important Notes

⚠️ **Never use `EnsureCreatedAsync()` in production code**
- It will drop all tables and recreate them
- All data will be lost
- Use migrations instead

✅ **Always test migrations on a copy of production data first**

✅ **Migrations are idempotent** - safe to run multiple times

✅ **Migration history is tracked** in `__EFMigrationsHistory` table per schema

## Troubleshooting

### Migration fails with "relation already exists"
- The database was created with `EnsureCreatedAsync()`
- Solution: Create initial migration from existing schema:
  ```bash
  dotnet ef migrations add InitialCreate --context OnboardingDbContext
  dotnet ef database update --context OnboardingDbContext
  ```

### Connection string issues
- Ensure connection string is set via environment variable or appsettings.json
- Format: `Host=hostname;Database=dbname;Username=user;Password=pass`

### Multiple contexts in same database
- Each context uses a different schema
- Migration history tables are separate per schema
- This is by design and working correctly

