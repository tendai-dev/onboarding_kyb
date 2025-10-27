#!/bin/bash

# List of services to fix
services=(
    "auditlog-service"
    "checklist-service" 
    "entity-configuration-service"
    "messaging-service"
    "notification-service"
    "projections-api"
    "webhook-dispatcher"
    "work-queue-service"
)

# Fix each Dockerfile
for service in "${services[@]}"; do
    dockerfile="/Users/mukurusystemsadministrator/Desktop/onboarding_kyc/services/$service/Dockerfile"
    
    if [ -f "$dockerfile" ]; then
        echo "Fixing $service Dockerfile..."
        
        # Create backup
        cp "$dockerfile" "$dockerfile.bak"
        
        # Add curl installation after the runtime stage line
        sed -i '' '/FROM mcr.microsoft.com\/dotnet\/aspnet:8.0 AS runtime/a\
\
# Install curl for health checks\
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
' "$dockerfile"
        
        echo "Fixed $service"
    else
        echo "Dockerfile not found for $service"
    fi
done

echo "All Dockerfiles fixed!"
