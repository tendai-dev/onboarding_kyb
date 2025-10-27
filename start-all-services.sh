#!/bin/bash

echo "🚀 Starting ALL microservices with proper database connections..."

# Common environment variables
NETWORK="onboarding_kyc_kyc-network"
DB_HOST="postgres"
DB_USER="keycloak"
DB_PASS="keycloak"

# Start all services with proper database connections
echo "Starting risk-service..."
docker run -d --name risk-service --network $NETWORK -p 8083:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=risk;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  risk-service

echo "Starting notification-service..."
docker run -d --name notification-service --network $NETWORK -p 8084:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=notifications;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  notification-service

echo "Starting checklist-service..."
docker run -d --name checklist-service --network $NETWORK -p 8085:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=checklist;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  checklist-service

echo "Starting entity-configuration-service..."
docker run -d --name entity-configuration-service --network $NETWORK -p 8086:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=entity_configuration;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  entity-configuration-service

echo "Starting messaging-service..."
docker run -d --name messaging-service --network $NETWORK -p 8087:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=messaging;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  messaging-service

echo "Starting projections-api..."
docker run -d --name projections-api --network $NETWORK -p 8088:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=projections;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  projections-api

echo "Starting auditlog-service..."
docker run -d --name auditlog-service --network $NETWORK -p 8089:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=auditlog;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  auditlog-service

echo "Starting work-queue-service..."
docker run -d --name work-queue-service --network $NETWORK -p 8090:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=workqueue;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  work-queue-service

echo "Starting webhook-dispatcher..."
docker run -d --name webhook-dispatcher --network $NETWORK -p 8091:8080 \
  -e ConnectionStrings__DefaultConnection="Host=$DB_HOST;Database=webhooks;Username=$DB_USER;Password=$DB_PASS" \
  -e ASPNETCORE_ENVIRONMENT=Development \
  webhook-dispatcher

echo "✅ All services started! Waiting for health checks..."
sleep 10

echo "📊 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(risk-service|notification-service|checklist-service|entity-configuration-service|messaging-service|projections-api|auditlog-service|work-queue-service|webhook-dispatcher)"

echo ""
echo "🎯 Infrastructure Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(kafka|postgres|redis|keycloak|minio|zookeeper)"
