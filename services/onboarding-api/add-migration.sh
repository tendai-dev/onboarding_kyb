#!/bin/bash
# Script to add a new EF Core migration for a specific DbContext
# Usage: ./add-migration.sh <migration-name> <context-name> [options]
#
# Examples:
#   ./add-migration.sh AddUserTable OnboardingDbContext
#   ./add-migration.sh UpdateRequirements EntityConfigurationDbContext -v
#   ./add-migration.sh AddIndexes WorkQueueDbContext --verbose

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if migration name is provided
if [ -z "$1" ]; then
    echo "Error: Migration name is required"
    echo "Usage: ./add-migration.sh <migration-name> <context-name> [options]"
    echo ""
    echo "Available contexts:"
    echo "  - OnboardingDbContext"
    echo "  - AuditLogDbContext"
    echo "  - ChecklistDbContext"
    echo "  - NotificationDbContext"
    echo "  - MessagingDbContext"
    echo "  - EntityConfigurationDbContext"
    echo "  - WorkQueueDbContext"
    echo "  - RiskDbContext"
    echo "  - ProjectionsDbContext"
    echo "  - DocumentDbContext"
    exit 1
fi

MIGRATION_NAME="$1"
CONTEXT_NAME="${2:-OnboardingDbContext}"
EXTRA_OPTIONS="${@:3}"

# Map context names to their migration output directories
declare -A CONTEXT_DIRS=(
    ["OnboardingDbContext"]="Migrations/Onboarding"
    ["AuditLogDbContext"]="Migrations/Audit"
    ["ChecklistDbContext"]="Migrations/Checklist"
    ["NotificationDbContext"]="Migrations/Notification"
    ["MessagingDbContext"]="Migrations/Messaging"
    ["EntityConfigurationDbContext"]="Migrations/EntityConfiguration"
    ["WorkQueueDbContext"]="Migrations/WorkQueue"
    ["RiskDbContext"]="Migrations/Risk"
    ["ProjectionsDbContext"]="Migrations/Projections"
    ["DocumentDbContext"]="Migrations/Document"
)

OUTPUT_DIR="${CONTEXT_DIRS[$CONTEXT_NAME]}"

if [ -z "$OUTPUT_DIR" ]; then
    echo "Error: Unknown context '$CONTEXT_NAME'"
    echo "Available contexts: ${!CONTEXT_DIRS[@]}"
    exit 1
fi

echo "Adding migration '$MIGRATION_NAME' for context '$CONTEXT_NAME'..."
echo "Output directory: src/Infrastructure/$OUTPUT_DIR"
echo ""

# Connection string for migration generation (doesn't need to connect, just for EF Core design-time)
export ConnectionStrings__PostgreSQL="Host=postgres;Port=5432;Database=kyb_case;Username=kyb;Password=kyb_password"

# Check if running in Docker or locally
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    # Running in Docker - use dotnet ef directly
    dotnet tool install --global dotnet-ef --version 8.0.11 > /dev/null 2>&1 || true
    dotnet ef migrations add "$MIGRATION_NAME" \
        --context "$CONTEXT_NAME" \
        --project src/Infrastructure/OnboardingApi.Infrastructure.csproj \
        --startup-project src/Presentation/OnboardingApi.Presentation.csproj \
        --output-dir "src/Infrastructure/$OUTPUT_DIR" \
        $EXTRA_OPTIONS
else
    # Running locally - use Docker
    docker run --rm \
        -v "$SCRIPT_DIR:/workspace" \
        -w /workspace \
        -e ConnectionStrings__PostgreSQL="$ConnectionStrings__PostgreSQL" \
        mcr.microsoft.com/dotnet/sdk:8.0 \
        bash -c "
            dotnet tool install --global dotnet-ef --version 8.0.11 > /dev/null 2>&1 || true
            /root/.dotnet/tools/dotnet-ef migrations add '$MIGRATION_NAME' \
                --context '$CONTEXT_NAME' \
                --project src/Infrastructure/OnboardingApi.Infrastructure.csproj \
                --startup-project src/Presentation/OnboardingApi.Presentation.csproj \
                --output-dir 'src/Infrastructure/$OUTPUT_DIR' \
                $EXTRA_OPTIONS
        "
fi

echo ""
echo "✓ Migration '$MIGRATION_NAME' added successfully for $CONTEXT_NAME"
echo ""
echo "Next steps:"
echo "1. Review the generated migration file in src/Infrastructure/$OUTPUT_DIR"
echo "2. Apply migration: docker-compose --profile migrations up onboarding-migrations"
echo "3. Or run migrations manually using the Migrations project"

