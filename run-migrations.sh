#!/bin/bash
# Script to run database migrations for onboarding-api
# This will create the missing projections.onboarding_case_projections table

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "Running Database Migrations"
echo "========================================="
echo ""

# Check if using Docker or local
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "Using Docker Compose to run migrations..."
    echo ""
    
    # Check if postgres is running
    if ! docker-compose ps postgres | grep -q "Up"; then
        echo "⚠️  PostgreSQL container is not running. Starting it..."
        docker-compose up -d postgres
        echo "Waiting for PostgreSQL to be ready..."
        sleep 5
    fi
    
    echo "Running migrations..."
    docker-compose --profile migrations up onboarding-migrations
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations completed successfully!"
        echo ""
        echo "The projections.onboarding_case_projections table should now exist."
        echo "You can now refresh your dashboard."
    else
        echo ""
        echo "❌ Migrations failed. Please check the error messages above."
        exit 1
    fi
else
    echo "Using .NET directly to run migrations..."
    echo ""
    
    # Check if we're in the right directory
    if [ ! -d "services/onboarding-api" ]; then
        echo "❌ Error: services/onboarding-api directory not found."
        echo "Please run this script from the project root directory."
        exit 1
    fi
    
    cd services/onboarding-api
    
    # Check for connection string
    if [ -z "$ConnectionStrings__PostgreSQL" ]; then
        echo "⚠️  ConnectionStrings__PostgreSQL not set."
        echo "Setting default connection string for local development..."
        export ConnectionStrings__PostgreSQL="Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password"
        echo ""
    fi
    
    echo "Running migrations..."
    echo "Connection: ${ConnectionStrings__PostgreSQL/Password=*/Password=***}"
    echo ""
    
    dotnet run --project src/Migrations/OnboardingApi.Migrations.csproj
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations completed successfully!"
        echo ""
        echo "The projections.onboarding_case_projections table should now exist."
        echo "You can now refresh your dashboard."
    else
        echo ""
        echo "❌ Migrations failed. Please check the error messages above."
        exit 1
    fi
fi

