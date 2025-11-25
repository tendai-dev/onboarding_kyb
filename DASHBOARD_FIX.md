# Dashboard 500 Error - Fixed

## Problem

The dashboard was showing 500 Internal Server Errors with the following error:
```
42P01: relation "projections.onboarding_case_projections" does not exist
```

## Root Cause

The database table `projections.onboarding_case_projections` was missing because database migrations had not been run. This table is required for the dashboard projections to work.

## Solution

Run the database migrations to create the missing table and schema.

### Option 1: Using Docker Compose (Recommended)

```bash
# From the project root directory
docker-compose --profile migrations up onboarding-migrations
```

### Option 2: Using the Migration Script

```bash
# From the project root directory
./run-migrations.sh
```

### Option 3: Using .NET Directly

```bash
cd services/onboarding-api

# Set connection string (adjust if needed)
export ConnectionStrings__PostgreSQL="Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password"

# Run migrations
dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
```

## What Gets Created

The migration will create:
- `projections` schema (if it doesn't exist)
- `projections.onboarding_case_projections` table
- All necessary indexes
- Migration history tracking

## After Running Migrations

1. **Refresh your browser** - The dashboard should now load without errors
2. **Check the console** - You should no longer see 500 errors
3. **Verify the table exists** (optional):
   ```sql
   SELECT COUNT(*) FROM projections.onboarding_case_projections;
   ```

## Additional Context

The migration system handles **10 separate database contexts**:
1. `onboarding` schema
2. `audit` schema
3. `checklist` schema
4. `notification` schema
5. `messaging` schema
6. `entity_configuration` schema
7. `work_queue` schema
8. `risk` schema
9. **`projections` schema** ← This is what was missing
10. `document` schema

All migrations are **idempotent** - safe to run multiple times.

## Troubleshooting

### If migrations fail with connection error:
- Ensure PostgreSQL is running
- Check your connection string matches your database setup
- Verify database credentials are correct

### If you see "relation already exists":
- The table may have been created manually
- The migration will skip it safely
- Check the migration logs for details

## Related Files

- Migration project: `services/onboarding-api/src/Migrations/`
- Migration files: `services/onboarding-api/src/Infrastructure/Migrations/Projections/`
- Migration guide: `services/onboarding-api/MIGRATION_GUIDE.md`

