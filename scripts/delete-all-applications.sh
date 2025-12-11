#!/bin/bash

# Delete All Applications Script
# WARNING: This will permanently delete ALL applications from the database
# This operation CANNOT be undone!
#
# Usage:
#   ./scripts/delete-all-applications.sh
#   ./scripts/delete-all-applications.sh "Host=127.0.0.1;Port=5433;Database=kyb_case;Username=postgres;Password=postgres"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/services/onboarding-api/src/Migrations"

echo "🗑️  Delete All Applications Utility"
echo "==================================="
echo ""
echo "⚠️  WARNING: This will permanently delete ALL applications from the database!"
echo "⚠️  This operation CANNOT be undone!"
echo ""

# Check if connection string is provided as argument
if [ -n "$1" ]; then
    CONNECTION_STRING="$1"
    echo "Using provided connection string"
else
    echo "Using connection string from appsettings.json"
fi

# Navigate to migrations directory
cd "$MIGRATIONS_DIR"

# Run the C# utility
if [ -n "$CONNECTION_STRING" ]; then
    CONNECTION_STRING="$CONNECTION_STRING" dotnet run -- delete-applications
else
    dotnet run -- delete-applications
fi

