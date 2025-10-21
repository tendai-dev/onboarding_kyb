# API Contract Governance

## Ownership & Review Process

### Contract Ownership
- **Each service owns its OpenAPI specification**
- Specs live in: `services/{service-name}/openapi.yaml`
- Changes require approval from:
  - Service owner (required)
  - API architect (for breaking changes)
  - Security team (for auth/data changes)

### OpenAPI-First Enforcement

**CI/CD Gates:**
```yaml
# .github/workflows/api-contract-validation.yml
name: API Contract Validation

on: [pull_request]

jobs:
  validate-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate OpenAPI specs
        run: |
          npm install -g @stoplight/spectral-cli
          spectral lint services/*/openapi.yaml --ruleset .spectral.yaml
      
      - name: Check for breaking changes
        uses: oasdiff/oasdiff-action@v0.0.15
        with:
          base: main
          revision: HEAD
          fail-on-diff: true
          format: text
      
      - name: Validate spec-to-code alignment
        run: |
          # Generate code from spec
          docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli generate \
            -i /local/services/onboarding-api/openapi.yaml \
            -g csharp-netcore \
            -o /local/generated
          
          # Compare with actual controllers
          ./scripts/validate-spec-code-alignment.sh
```

### Versioning Strategy

**URL Versioning:**
```
✅ Good:
  /onboarding/v1/cases
  /documents/v1/files
  /risk/v1/assessments

❌ Bad:
  /v1/onboarding/cases  (version before service)
  /onboarding/cases     (no version)
  /onboarding/v1.2/cases (minor versions in URL)
```

**Version Lifecycle:**
1. **Active** (v1) - Current production version
2. **Deprecated** (v0) - 6-month sunset period
3. **Sunset** - Removed, returns 410 Gone

**Deprecation Headers:**
```http
# Deprecated endpoint response
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sun, 01 Jun 2025 00:00:00 GMT
Link: </v2/onboarding/cases>; rel="successor-version"
Warning: 299 - "This API version is deprecated and will be removed on 2025-06-01"
```

### Migration Playbook

**For Breaking Changes (requiring /v2):**

```markdown
## Migration Checklist

Week 1-2: Design & Announce
- [ ] Document breaking changes in CHANGELOG.md
- [ ] Create migration guide with examples
- [ ] Announce via email + status page (6 months notice)
- [ ] Add deprecation headers to v1

Week 3-4: Implement v2
- [ ] Create v2 OpenAPI spec
- [ ] Implement v2 endpoints (new namespace)
- [ ] Add contract tests for v2
- [ ] Deploy to staging
- [ ] Update documentation

Week 5-8: Partner Migration
- [ ] Provide sandbox environment for v2 testing
- [ ] Offer migration support calls
- [ ] Track v1 → v2 adoption metrics
- [ ] Send reminder emails

Month 3-6: Dual-run Period
- [ ] Both v1 and v2 available
- [ ] Monitor v1 usage decline
- [ ] Send final migration reminders (30 days before sunset)
- [ ] Offer extended support for large partners (if needed)

Month 6: Sunset v1
- [ ] v1 endpoints return 410 Gone
- [ ] Redirect to v2 documentation
- [ ] Remove v1 code after 30 days
- [ ] Post-mortem: lessons learned
```

### Uniform Conventions

**Standard Headers:**
```http
# Request
GET /onboarding/v1/cases/123
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001  (POST/PUT/PATCH/DELETE only)
If-None-Match: "v1-abc123"  (conditional GET)
If-Match: "v1-abc123"  (conditional PUT/PATCH)
Authorization: Bearer <token>
Accept: application/json

# Response
HTTP/1.1 200 OK
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
ETag: "v1-abc123"
Last-Modified: Wed, 21 Oct 2025 14:30:00 GMT
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

**Pagination Standard:**
```http
GET /onboarding/v1/cases?page=2&page_size=50&sort=created_at&order=desc

Response:
{
  "items": [...],
  "total": 500,
  "page": 2,
  "page_size": 50,
  "links": {
    "self": "/onboarding/v1/cases?page=2&page_size=50",
    "first": "/onboarding/v1/cases?page=1&page_size=50",
    "prev": "/onboarding/v1/cases?page=1&page_size=50",
    "next": "/onboarding/v1/cases?page=3&page_size=50",
    "last": "/onboarding/v1/cases?page=10&page_size=50"
  }
}
```

### Gateway Policies

**Route Configuration:**
```yaml
# platform/gateway/policies/rate-limits.yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting-default
config:
  minute: 1000
  policy: redis
  redis_host: redis.platform-observability
  hide_client_headers: false
---
# Per-service overrides
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting-document-upload
config:
  minute: 100  # Lower limit for uploads
  policy: redis
---
# Per-client overrides (via consumer groups)
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting-premium-tier
config:
  minute: 10000  # Higher for premium partners
```

**Namespace Routing:**
```yaml
# Enforced in Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway
  annotations:
    # All routes must follow /v{N}/{service}/ pattern
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
  - host: api.yourdomain.tld
    http:
      paths:
      - path: /(v[0-9]+)/onboarding/(.*)
        pathType: Prefix
        backend:
          service:
            name: onboarding-api
            port:
              number: 8080
```

### Global AuthN/AuthZ Hooks

**Nginx Ingress Auth:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    # External auth to Keycloak
    nginx.ingress.kubernetes.io/auth-url: "https://keycloak.yourdomain.tld/realms/partners/protocol/openid-connect/userinfo"
    nginx.ingress.kubernetes.io/auth-response-headers: "X-Auth-Request-User,X-Auth-Request-Email,X-Auth-Request-Access-Token"
    
    # Skip auth for health/metrics endpoints
    nginx.ingress.kubernetes.io/configuration-snippet: |
      location ~* ^/(health|metrics) {
        auth_request off;
      }
```

### Definition of Done (API Changes)

- [ ] OpenAPI spec updated
- [ ] Spec validated (Spectral linting)
- [ ] Breaking changes approved by architect
- [ ] Migration guide written (if breaking)
- [ ] Contract tests added
- [ ] Code generated from spec (if using codegen)
- [ ] Spec-to-code alignment verified
- [ ] Deprecation headers added (if deprecating)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Partners notified (if breaking)
- [ ] Monitoring alerts updated

### Tooling

**Spectral Rules (.spectral.yaml):**
```yaml
extends: [[spectral:oas, all]]
rules:
  # Enforce versioning
  oas3-api-servers:
    description: Servers must include /v{N} in path
    severity: error
    given: $.servers[*].url
    then:
      function: pattern
      functionOptions:
        match: "^https?://.*/(v[0-9]+)$"
  
  # Enforce standard headers
  operation-id:
    description: All operations must have operationId
    severity: error
    given: $.paths[*][*]
    then:
      field: operationId
      function: truthy
  
  # Enforce idempotency header
  operation-post-idempotency-key:
    description: POST operations must require Idempotency-Key header
    severity: error
    given: $.paths[*].post
    then:
      field: parameters
      function: schema
      functionOptions:
        schema:
          contains:
            properties:
              name:
                const: Idempotency-Key
```

### Monitoring Contract Compliance

**Metrics:**
```promql
# Track deprecated API usage
rate(http_requests_total{deprecated="true"}[5m])

# Alert when deprecated API usage > threshold
alert: DeprecatedAPIUsageHigh
expr: rate(http_requests_total{deprecated="true"}[5m]) > 10
annotations:
  summary: "High usage of deprecated API"
  description: "{{ $labels.path }} receiving {{ $value }} req/s"
```

### Examples

**Valid v1 → v2 Migration:**
```yaml
# v1: Original design (field names)
POST /onboarding/v1/cases
{
  "applicantFirstName": "John",
  "applicantLastName": "Doe"
}

# v2: Improved design (nested objects)
POST /onboarding/v2/cases
{
  "applicant": {
    "first_name": "John",
    "last_name": "Doe"
  }
}

# Migration code (v1 still supported for 6 months)
# v1 internally maps to v2 structure
```

### References

- [OpenAPI Specification](https://swagger.io/specification/)
- [API Versioning Best Practices](https://restfulapi.net/versioning/)
- [Deprecation HTTP Header](https://datatracker.ietf.org/doc/html/draft-dalal-deprecation-header)
- [Spectral Linting](https://stoplight.io/open-source/spectral)

