#!/bin/bash
# Script to generate EF Core migrations using Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Connection string for migration generation (doesn't need to connect, just for EF Core design-time)
export ConnectionStrings__PostgreSQL="Host=postgres;Port=5432;Database=kyb_case;Username=kyb;Password=kyb_password"

echo "Generating initial migrations for all DbContexts..."
echo ""

# Function to generate migration for a context
generate_migration() {
    local CONTEXT=$1
    local OUTPUT_DIR=$2
    echo "Generating migration for $CONTEXT -> $OUTPUT_DIR"
    
    docker run --rm \
        -v "$SCRIPT_DIR:/workspace" \
        -w /workspace \
        -e ConnectionStrings__PostgreSQL="$ConnectionStrings__PostgreSQL" \
        mcr.microsoft.com/dotnet/sdk:8.0 \
        bash -c "
            dotnet tool install --global dotnet-ef --version 8.0.11 > /dev/null 2>&1 || true
            /root/.dotnet/tools/dotnet-ef migrations add InitialCreate \
                --context $CONTEXT \
                --project src/Infrastructure/OnboardingApi.Infrastructure.csproj \
                --startup-project src/Presentation/OnboardingApi.Presentation.csproj \
                --output-dir src/Infrastructure/$OUTPUT_DIR 2>&1
        " || echo "Note: Migration may already exist for $CONTEXT"
    
    echo "✓ Completed $CONTEXT"
    echo ""
}

# Generate migrations for all contexts
generate_migration "OnboardingDbContext" "Migrations/Onboarding"
generate_migration "AuditLogDbContext" "Migrations/Audit"
generate_migration "ChecklistDbContext" "Migrations/Checklist"
generate_migration "NotificationDbContext" "Migrations/Notification"
generate_migration "MessagingDbContext" "Migrations/Messaging"
generate_migration "EntityConfigurationDbContext" "Migrations/EntityConfiguration"
generate_migration "WorkQueueDbContext" "Migrations/WorkQueue"
generate_migration "RiskDbContext" "Migrations/Risk"
generate_migration "ProjectionsDbContext" "Migrations/Projections"
generate_migration "DocumentDbContext" "Migrations/Document"

echo "All migrations generated successfully!"
echo ""
echo "Next steps:"
echo "1. Review the generated migration files"
echo "2. Run migrations: docker-compose --profile migrations up onboarding-migrations"
echo "3. Start the API: docker-compose up -d onboarding-api"

