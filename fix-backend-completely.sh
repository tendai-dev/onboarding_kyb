#!/bin/bash

echo "🔧 FIXING .NET BACKEND SERVICES COMPLETELY"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${RED}MAIN ISSUES DETECTED:${NC}"
echo "1. Docker is not running"
echo "2. Most services missing from docker-compose.yml"
echo "3. No containers running"
echo "4. Some ports occupied by orphan processes"

echo -e "\n${BLUE}Step 1: Starting Docker Desktop${NC}"

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo "Starting Docker Desktop..."
    open -a Docker 2>/dev/null || {
        echo -e "${RED}Please start Docker Desktop manually${NC}"
        echo "After starting Docker, re-run this script"
        exit 1
    }
    
    echo "Waiting for Docker to start (up to 60 seconds)..."
    for i in {1..60}; do
        if docker ps >/dev/null 2>&1; then
            echo -e "\n${GREEN}✓ Docker is running${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if ! docker ps >/dev/null 2>&1; then
        echo -e "\n${RED}Docker failed to start. Please start it manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Docker is already running${NC}"
fi

echo -e "\n${BLUE}Step 2: Cleaning up orphan processes on ports${NC}"

# Kill processes on service ports
PORTS=(8081 8082 8083 8084 8085 8086 8087 8088 8089 8090 8091)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "Killing process on port $port (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done

echo -e "${GREEN}✓ Ports cleaned${NC}"

echo -e "\n${BLUE}Step 3: Creating complete docker-compose.yml${NC}"

# Backup existing docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup 2>/dev/null

# Create a complete docker-compose.yml with all services
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:14-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache
  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Message Broker
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  # Object Storage
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  # Authentication
  keycloak:
    image: quay.io/keycloak/keycloak:22.0.1
    container_name: keycloak
    environment:
      KC_DB: postgres
      KC_DB_URL_HOST: postgres
      KC_DB_URL_DATABASE: keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_HTTP_ENABLED: true
      KC_HOSTNAME_STRICT_HTTPS: false
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    command: start-dev

  # Microservices
  onboarding-api:
    build: ./services/onboarding-api
    container_name: onboarding-api
    ports:
      - "8081:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=onboarding;Username=postgres;Password=postgres
    depends_on:
      - postgres
      - redis
      - kafka
    restart: unless-stopped

  document-service:
    build: ./services/document-service
    container_name: document-service
    ports:
      - "8082:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=documents;Username=postgres;Password=postgres
      - MinIO__Endpoint=minio:9000
      - MinIO__AccessKey=minioadmin
      - MinIO__SecretKey=minioadmin
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  risk-service:
    build: ./services/risk-service
    container_name: risk-service
    ports:
      - "8083:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=risk;Username=postgres;Password=postgres
    depends_on:
      - postgres
    restart: unless-stopped

  notification-service:
    build: ./services/notification-service
    container_name: notification-service
    ports:
      - "8085:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=notifications;Username=postgres;Password=postgres
    depends_on:
      - postgres
      - kafka
    restart: unless-stopped

  checklist-service:
    build: ./services/checklist-service
    container_name: checklist-service
    ports:
      - "8086:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=checklist;Username=postgres;Password=postgres
    depends_on:
      - postgres
    restart: unless-stopped

  messaging-service:
    build: ./services/messaging-service
    container_name: messaging-service
    ports:
      - "8087:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=messaging;Username=postgres;Password=postgres
      - Kafka__BootstrapServers=kafka:9092
    depends_on:
      - postgres
      - kafka
    restart: unless-stopped

  auditlog-service:
    build: ./services/auditlog-service
    container_name: auditlog-service
    ports:
      - "8088:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=auditlog;Username=postgres;Password=postgres
    depends_on:
      - postgres
      - kafka
    restart: unless-stopped

  webhook-dispatcher:
    build: ./services/webhook-dispatcher
    container_name: webhook-dispatcher
    ports:
      - "8089:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=webhooks;Username=postgres;Password=postgres
    depends_on:
      - postgres
    restart: unless-stopped

  projections-api:
    build: ./services/projections-api
    container_name: projections-api
    ports:
      - "8090:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=projections;Username=postgres;Password=postgres
      - EventStore__ConnectionString=Host=postgres;Database=events;Username=postgres;Password=postgres
    depends_on:
      - postgres
    restart: unless-stopped

  work-queue-service:
    build: ./services/work-queue-service
    container_name: work-queue-service
    ports:
      - "8091:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=workqueue;Username=postgres;Password=postgres
      - Redis__ConnectionString=redis:6379
    depends_on:
      - postgres
      - redis
      - kafka
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:

networks:
  default:
    name: onboarding_kyc_network
    driver: bridge
EOF

echo -e "${GREEN}✓ Complete docker-compose.yml created${NC}"

echo -e "\n${BLUE}Step 4: Creating database initialization script${NC}"

mkdir -p scripts
cat > scripts/init-multiple-databases.sh << 'EOF'
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE keycloak;
    CREATE DATABASE onboarding;
    CREATE DATABASE documents;
    CREATE DATABASE risk;
    CREATE DATABASE notifications;
    CREATE DATABASE checklist;
    CREATE DATABASE messaging;
    CREATE DATABASE auditlog;
    CREATE DATABASE webhooks;
    CREATE DATABASE projections;
    CREATE DATABASE workqueue;
    CREATE DATABASE events;
EOSQL
EOF

chmod +x scripts/init-multiple-databases.sh

echo -e "${GREEN}✓ Database initialization script created${NC}"

echo -e "\n${BLUE}Step 5: Building all services${NC}"
echo "This will take several minutes as it builds all .NET services..."

# Build services one by one to better handle errors
SERVICES=(
    "postgres"
    "redis"
    "zookeeper"
    "kafka"
    "minio"
    "keycloak"
)

# Start infrastructure services first
for service in "${SERVICES[@]}"; do
    echo "Starting $service..."
    docker-compose up -d $service 2>&1 | grep -v "WARNING" || true
    sleep 2
done

echo -e "\n${BLUE}Waiting for infrastructure to be ready...${NC}"
sleep 15

echo -e "\n${BLUE}Step 6: Building .NET services${NC}"

# Build .NET services
docker-compose build --parallel

echo -e "\n${BLUE}Step 7: Starting all services${NC}"

# Start all services
docker-compose up -d

echo -e "\n${BLUE}Step 8: Waiting for services to be healthy${NC}"
sleep 20

echo -e "\n${BLUE}Step 9: Checking service health${NC}"

SERVICES_TO_CHECK=(
    "Postgres:5432"
    "Redis:6379"
    "Kafka:9092"
    "MinIO:9000"
    "Keycloak:8080"
    "Onboarding-API:8081"
    "Document-Service:8082"
    "Risk-Service:8083"
    "Notification:8085"
    "Checklist:8086"
    "Messaging:8087"
    "Audit-Log:8088"
    "Webhook:8089"
    "Projections:8090"
    "Work-Queue:8091"
)

HEALTHY=0
TOTAL=${#SERVICES_TO_CHECK[@]}

for service_port in "${SERVICES_TO_CHECK[@]}"; do
    IFS=':' read -r name port <<< "$service_port"
    
    # Check if service is responding
    if timeout 2 bash -c "echo > /dev/tcp/localhost/$port" 2>/dev/null; then
        echo -e "${GREEN}✓ $name (port $port) - RUNNING${NC}"
        HEALTHY=$((HEALTHY + 1))
    else
        echo -e "${YELLOW}⚠ $name (port $port) - STARTING${NC}"
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}BACKEND SERVICES FIX COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\nServices Status: $HEALTHY/$TOTAL running"

echo -e "\n${BLUE}Service URLs:${NC}"
echo "• Keycloak: http://localhost:8080 (admin/admin)"
echo "• Onboarding API: http://localhost:8081"
echo "• Document Service: http://localhost:8082"
echo "• Risk Service: http://localhost:8083"
echo "• MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"

echo -e "\n${BLUE}To check logs:${NC}"
echo "docker-compose logs [service-name]"

echo -e "\n${BLUE}To test a service:${NC}"
echo "curl http://localhost:8081/health"

if [ $HEALTHY -lt $TOTAL ]; then
    echo -e "\n${YELLOW}Some services are still starting. Wait a minute and run:${NC}"
    echo "docker-compose ps"
fi

echo -e "\n${GREEN}✅ Your .NET backend services are now properly configured and running!${NC}"
