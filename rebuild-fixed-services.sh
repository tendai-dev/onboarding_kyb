#!/bin/bash

echo "🚀 Rebuilding all fixed services..."

services=(
    "risk-service"
    "notification-service"
    "checklist-service"
    "messaging-service"
    "projections-api"
    "auditlog-service"
    "work-queue-service"
)

# Build all services in parallel
for service in "${services[@]}"; do
    echo "Building $service..."
    cd "/Users/mukurusystemsadministrator/Desktop/onboarding_kyc/services/$service"
    docker build -t "$service" . &
done

echo "⏳ Waiting for all builds to complete..."
wait

echo "✅ All services rebuilt successfully!"
