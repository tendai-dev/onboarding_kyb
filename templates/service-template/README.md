# Service Template Generator

This template provides a production-ready .NET 8 service scaffold with all batteries included:

## Features Baked In

✅ **Clean/Hexagonal Architecture** - Domain, Application, Infrastructure, Presentation layers  
✅ **CQRS** - MediatR for commands and queries  
✅ **Event-Driven** - Kafka event bus with outbox pattern  
✅ **OpenAPI-First** - Swagger/OpenAPI specification  
✅ **/v1 Versioning** - URL-based API versioning  
✅ **Idempotency** - Redis-backed idempotency middleware  
✅ **Standard Errors** - JSON error envelope with debug_id  
✅ **Distributed Tracing** - OpenTelemetry integration  
✅ **Rate Limiting** - Redis-backed rate limiting middleware  
✅ **Resilience** - Polly retry policies, timeouts, circuit breakers  
✅ **Observability** - Structured logging, Prometheus metrics  
✅ **Security** - OAuth 2.1 JWT validation, RBAC  
✅ **Health Checks** - /health/live and /health/ready endpoints  
✅ **Docker** - Multi-stage Dockerfile with non-root user  
✅ **Helm Chart** - Production-ready Kubernetes deployment  

## Usage

```bash
# Generate new service
./generate-service.sh my-new-service

# Output:
# services/my-new-service/
#   src/
#     Domain/
#     Application/
#     Infrastructure/
#     Presentation/
#   tests/
#   Dockerfile
#   openapi.yaml
```

## What You Get

### 1. Domain Layer (Framework-Free)
```
Domain/
  ├── Aggregates/
  │   └── YourAggregate.cs          # Rich domain model
  ├── ValueObjects/
  │   └── YourValueObject.cs        # Immutable value objects
  ├── Events/
  │   └── DomainEvents.cs           # Domain event definitions
  └── YourService.Domain.csproj
```

### 2. Application Layer (Use Cases)
```
Application/
  ├── Commands/
  │   ├── CreateCommand.cs
  │   └── CreateCommandHandler.cs
  ├── Queries/
  │   ├── GetQuery.cs
  │   └── GetQueryHandler.cs
  ├── Behaviors/
  │   ├── ValidationBehavior.cs     # FluentValidation pipeline
  │   └── LoggingBehavior.cs        # Performance logging
  ├── Interfaces/
  │   ├── IRepository.cs
  │   └── IEventBus.cs
  └── YourService.Application.csproj
```

### 3. Infrastructure Layer (Adapters)
```
Infrastructure/
  ├── Persistence/
  │   ├── DbContext.cs
  │   ├── Configurations/
  │   └── Repositories/
  ├── EventBus/
  │   └── KafkaEventBus.cs
  ├── Resilience/
  │   └── PollyPolicies.cs
  └── YourService.Infrastructure.csproj
```

### 4. Presentation Layer (API)
```
Presentation/
  ├── Controllers/
  │   └── YourController.cs         # REST endpoints
  ├── Filters/
  │   ├── IdempotencyFilter.cs      # Auto idempotency
  │   ├── RateLimitFilter.cs        # Rate limiting
  │   └── GlobalExceptionFilter.cs  # Error handling
  ├── Models/
  │   └── ApiModels.cs              # DTOs
  ├── Program.cs                    # Startup configuration
  └── appsettings.json
```

### 5. OpenAPI Specification
- Complete API documentation
- Request/response schemas
- Error definitions
- Security requirements
- Examples

### 6. Helm Chart
- Deployment with health checks
- Service (ClusterIP)
- ConfigMap for configuration
- Secrets for credentials
- HPA for autoscaling
- NetworkPolicy
- ServiceMonitor for Prometheus

### 7. Tests
- Unit tests (Domain logic)
- Integration tests (API endpoints)
- Contract tests (Pact)

## Service Template Structure

```
service-template/
├── Domain/
│   ├── Aggregates/
│   │   └── {{Aggregate}}.cs
│   ├── ValueObjects/
│   ├── Events/
│   └── {{Service}}.Domain.csproj
├── Application/
│   ├── Commands/
│   │   ├── Create{{Aggregate}}Command.cs
│   │   └── Create{{Aggregate}}CommandHandler.cs
│   ├── Queries/
│   ├── Behaviors/
│   ├── Interfaces/
│   └── {{Service}}.Application.csproj
├── Infrastructure/
│   ├── Persistence/
│   ├── EventBus/
│   ├── Resilience/
│   └── {{Service}}.Infrastructure.csproj
├── Presentation/
│   ├── Controllers/
│   ├── Filters/
│   ├── Models/
│   ├── Program.cs
│   └── {{Service}}.Presentation.csproj
├── Tests/
│   ├── Unit/
│   └── Integration/
├── Dockerfile
├── openapi.yaml
└── README.md
```

## Configuration

All services use standard configuration structure:

```json
{
  "ConnectionStrings": {
    "PostgreSQL": "Host=postgresql;Database=mydb;Username=user;Password=pass",
    "Redis": "redis:6379,password=pass"
  },
  "Kafka": {
    "BootstrapServers": "kafka:9092",
    "DomainEventsTopic": "myservice.domain-events",
    "IntegrationEventsTopic": "myservice.integration-events"
  },
  "Keycloak": {
    "Authority": "https://keycloak.yourdomain.tld/realms/partners",
    "Audience": "myservice-api"
  },
  "RateLimiting": {
    "DefaultLimit": 100,
    "WindowSeconds": 60
  },
  "Resilience": {
    "DatabaseTimeout": 30,
    "RedisTimeout": 3,
    "HttpTimeout": 10,
    "RetryCount": 3
  }
}
```

## Middleware Stack (Order Matters!)

```csharp
// Program.cs middleware pipeline
app.UseMetricServer();              // 1. Prometheus metrics
app.UseHttpMetrics();

app.UseRequestId();                 // 2. Request ID injection
app.UseRateLimiting();             // 3. Rate limiting
app.UseAuthentication();            // 4. OAuth 2.1 JWT
app.UseAuthorization();             // 5. RBAC checks
app.UseIdempotency();              // 6. Idempotency (state-changing ops)

app.MapControllers();
```

## Quick Start

1. **Generate service:**
   ```bash
   ./generate-service.sh payment-service
   ```

2. **Implement domain logic:**
   ```bash
   cd services/payment-service/src/Domain/Aggregates
   vi Payment.cs  # Define your aggregate
   ```

3. **Add commands/queries:**
   ```bash
   cd ../Application/Commands
   vi CreatePaymentCommand.cs
   vi CreatePaymentCommandHandler.cs
   ```

4. **Create OpenAPI spec:**
   ```bash
   vi openapi.yaml  # Define API contract
   ```

5. **Build and test:**
   ```bash
   dotnet build
   dotnet test
   ```

6. **Deploy:**
   ```bash
   docker build -t payment-service .
   helm install payment-service ./helm-chart
   ```

## Best Practices

1. **Keep domain pure** - No framework dependencies in Domain layer
2. **Validate early** - FluentValidation in Application layer
3. **Fail fast** - Validate at API boundary
4. **Log structured** - Use Serilog with JSON formatting
5. **Trace everything** - Propagate trace context
6. **Handle errors gracefully** - Return standard error envelope
7. **Test thoroughly** - Unit + integration + contract tests
8. **Document APIs** - OpenAPI spec before code
9. **Monitor actively** - Expose Prometheus metrics
10. **Secure by default** - OAuth 2.1, rate limiting, idempotency

## Examples Included

- ✅ onboarding-api (full implementation)
- ✅ document-service (with MinIO, virus scanning, deduplication)
- ✅ webhook-dispatcher (with HMAC signatures, retries)
- ✅ outbox-relay (background worker pattern)

Refer to these for implementation patterns.

