#!/bin/bash
# Simple migration script - similar to CashManagement pattern
# Usage: ./add-migration-simple.sh <migration-name> [context-name] [options]

set -e

cd "$(dirname "$0")"

MIGRATION_NAME="${1:-}"
CONTEXT_NAME="${2:-OnboardingDbContext}"
EXTRA_OPTIONS="${@:3}"

if [ -z "$MIGRATION_NAME" ]; then
    echo "Usage: ./add-migration-simple.sh <migration-name> [context-name] [options]"
    echo "Example: ./add-migration-simple.sh AddUserTable OnboardingDbContext -v"
    exit 1
fi

# Map context to output directory
case "$CONTEXT_NAME" in
    OnboardingDbContext) OUTPUT_DIR="Migrations/Onboarding" ;;
    AuditLogDbContext) OUTPUT_DIR="Migrations/Audit" ;;
    ChecklistDbContext) OUTPUT_DIR="Migrations/Checklist" ;;
    NotificationDbContext) OUTPUT_DIR="Migrations/Notification" ;;
    MessagingDbContext) OUTPUT_DIR="Migrations/Messaging" ;;
    EntityConfigurationDbContext) OUTPUT_DIR="Migrations/EntityConfiguration" ;;
    WorkQueueDbContext) OUTPUT_DIR="Migrations/WorkQueue" ;;
    RiskDbContext) OUTPUT_DIR="Migrations/Risk" ;;
    ProjectionsDbContext) OUTPUT_DIR="Migrations/Projections" ;;
    DocumentDbContext) OUTPUT_DIR="Migrations/Document" ;;
    *) 
        echo "Error: Unknown context '$CONTEXT_NAME'"
        exit 1
        ;;
esac

# Navigate to Infrastructure directory and run migration
cd src/Infrastructure && \
dotnet ef migrations add "$MIGRATION_NAME" \
    --context "$CONTEXT_NAME" \
    --project OnboardingApi.Infrastructure.csproj \
    --startup-project ../Presentation/OnboardingApi.Presentation.csproj \
    --output-dir "$OUTPUT_DIR" \
    $EXTRA_OPTIONS

