#!/bin/bash

# List of services to rebuild
services=(
    "risk-service"
    "auditlog-service"
    "checklist-service" 
    "entity-configuration-service"
    "messaging-service"
    "notification-service"
    "projections-api"
    "webhook-dispatcher"
    "work-queue-service"
)

echo "Rebuilding services with curl support..."

for service in "${services[@]}"; do
    echo "Building $service..."
    cd "/Users/mukurusystemsadministrator/Desktop/onboarding_kyc/services/$service"
    docker build -t "$service" . &
done

echo "Waiting for all builds to complete..."
wait

echo "All services rebuilt successfully!"
echo "Now restart your docker-compose to use the updated images:"
echo "docker-compose down && docker-compose up -d"
