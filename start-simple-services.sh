#!/bin/bash

echo "🚀 Starting services in simple mode..."

NETWORK="onboarding_kyc_kyc-network"

# Start services with minimal configuration
echo "Starting risk-service..."
docker run -d --name risk-service --network $NETWORK -p 8083:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  risk-service

echo "Starting notification-service..."
docker run -d --name notification-service --network $NETWORK -p 8084:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  notification-service

echo "Starting checklist-service..."
docker run -d --name checklist-service --network $NETWORK -p 8085:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  checklist-service

echo "Starting messaging-service..."
docker run -d --name messaging-service --network $NETWORK -p 8087:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  messaging-service

echo "Starting projections-api..."
docker run -d --name projections-api --network $NETWORK -p 8088:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  projections-api

echo "Starting auditlog-service..."
docker run -d --name auditlog-service --network $NETWORK -p 8089:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  auditlog-service

echo "Starting work-queue-service..."
docker run -d --name work-queue-service --network $NETWORK -p 8090:8080 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e SKIP_MIGRATIONS=true \
  work-queue-service

echo "✅ All services started!"
sleep 15

echo "📊 Current Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | head -15
