#!/bin/bash

echo "🔧 Fixing migration issues in all services..."

# List of services to fix
services=(
    "risk-service"
    "notification-service"
    "checklist-service"
    "messaging-service"
    "projections-api"
    "auditlog-service"
    "work-queue-service"
)

# Fix each service's Program.cs
for service in "${services[@]}"; do
    program_file="/Users/mukurusystemsadministrator/Desktop/onboarding_kyc/services/$service/src/Presentation/Program.cs"
    
    if [ -f "$program_file" ]; then
        echo "Fixing $service..."
        
        # Comment out the MigrateAsync line
        sed -i '' 's/await context.Database.MigrateAsync();/\/\/ await context.Database.MigrateAsync(); \/\/ Temporarily disabled for Docker/' "$program_file"
        
        echo "✅ Fixed $service"
    fi
done

echo "All services fixed! Now rebuilding..."
