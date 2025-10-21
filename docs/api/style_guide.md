# API Style Guide

## Overview

This document defines the API design standards for the Corporate Digital Onboarding & KYC Platform. All services MUST adhere to these guidelines to ensure consistency, maintainability, and excellent developer experience.

## Core Principles

1. **RESTful Architecture**: Resource-oriented URIs, standard HTTP methods
2. **JSON-Only**: All requests and responses use `application/json`
3. **OpenAPI-First**: Document APIs before implementation
4. **Consistency**: Predictable patterns across all endpoints
5. **Security**: OAuth 2.1 Bearer tokens, HTTPS only
6. **Resilience**: Idempotency, retries, circuit breakers

## URI Conventions

### Format
```
https://api.yourdomain.tld/{service}/v1/{resource-collection}/{resource-id}
```

### Rules
- **Lowercase**: All URIs use lowercase letters
- **Hyphens**: Use hyphens for multi-word resources (e.g., `/onboarding-cases`)
- **Plural Nouns**: Collections are plural (e.g., `/cases`, `/documents`)
- **No Trailing Slashes**: `/cases` not `/cases/`
- **Versioning**: Version in URI path (`/v1`, `/v2`)

### Examples
```
✅ Good:
GET  /onboarding/v1/cases
POST /onboarding/v1/cases
GET  /onboarding/v1/cases/{id}
PUT  /onboarding/v1/cases/{id}

❌ Bad:
GET  /Onboarding/V1/Cases
POST /onboarding/v1/createCase
GET  /onboarding/v1/case/{id}
```

## HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource(s) | ✅ | ✅ |
| POST | Create new resource | ❌ | ❌ |
| PUT | Replace entire resource | ✅ | ❌ |
| PATCH | Update partial resource | ❌ | ❌ |
| DELETE | Remove resource | ✅ | ❌ |

## Request Headers

### Required Headers

```http
Authorization: Bearer <JWT-token>
Content-Type: application/json
Accept: application/json
Idempotency-Key: <UUID>  # Required for POST/PUT/PATCH/DELETE
```

### Optional Headers

```http
X-Request-Id: <UUID>           # Auto-generated if not provided
Prefer: return=minimal         # Request minimal response
Prefer: respond-async          # Request async processing (returns 202)
If-None-Match: "<etag>"        # Conditional GET
If-Match: "<etag>"             # Conditional PUT/PATCH
```

## Response Format

### Single Resource

```json
{
  "data": {
    "id": "uuid",
    "type": "onboarding-case",
    "attributes": { ... },
    "relationships": { ... },
    "links": {
      "self": "/onboarding/v1/cases/uuid"
    }
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Collection

```json
{
  "items": [
    { "id": "uuid1", ... },
    { "id": "uuid2", ... }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "links": {
    "self": "/onboarding/v1/cases?page=1",
    "next": "/onboarding/v1/cases?page=2",
    "prev": null
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Error Responses

### Standard Error Envelope

```json
{
  "name": "ValidationError",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_EMAIL"
    }
  ],
  "debug_id": "req-uuid"
}
```

### HTTP Status Codes

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (with `Location` header) |
| 202 | Accepted | Async operation started |
| 204 | No Content | Successful DELETE or `Prefer: return=minimal` |
| 304 | Not Modified | ETag match (conditional GET) |
| 400 | Bad Request | Malformed request |
| 401 | Unauthorized | Missing/invalid Bearer token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource or concurrency issue |
| 415 | Unsupported Media Type | Non-JSON Content-Type |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded (with `Retry-After`) |
| 500 | Internal Server Error | Unexpected error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Temporary unavailability |
| 504 | Gateway Timeout | Upstream timeout |

## Naming Conventions

### JSON Field Names
- **snake_case**: All field names use snake_case
- **Lowercase**: No capitals
- **Clear & Descriptive**: Self-documenting names

```json
✅ Good:
{
  "first_name": "John",
  "date_of_birth": "1990-01-01",
  "residential_address": { ... }
}

❌ Bad:
{
  "FirstName": "John",
  "DOB": "1990-01-01",
  "addr": { ... }
}
```

### Date/Time Fields
- **ISO 8601 format**: `YYYY-MM-DDTHH:MM:SS.sssZ`
- **UTC timezone**: Always use UTC (`Z` suffix)
- **Field naming**: `*_at` for timestamps (e.g., `created_at`, `updated_at`)

```json
{
  "created_at": "2025-10-21T14:30:00.000Z",
  "updated_at": "2025-10-21T15:45:30.123Z"
}
```

## Pagination

### Query Parameters
```
GET /onboarding/v1/cases?page=2&page_size=50
```

- `page`: Page number (1-indexed, default: 1)
- `page_size`: Items per page (default: 20, max: 100)

### Response
```json
{
  "items": [ ... ],
  "total": 500,
  "page": 2,
  "page_size": 50,
  "links": {
    "self": "/onboarding/v1/cases?page=2&page_size=50",
    "next": "/onboarding/v1/cases?page=3&page_size=50",
    "prev": "/onboarding/v1/cases?page=1&page_size=50",
    "first": "/onboarding/v1/cases?page=1&page_size=50",
    "last": "/onboarding/v1/cases?page=10&page_size=50"
  }
}
```

## Filtering & Sorting

### Filtering
```
GET /onboarding/v1/cases?status=submitted&type=business
```

### Sorting
```
GET /onboarding/v1/cases?sort=created_at&order=desc
```

- `sort`: Field name
- `order`: `asc` or `desc` (default: `asc`)

## Idempotency

### Requirement
ALL state-changing operations (POST/PUT/PATCH/DELETE) MUST include `Idempotency-Key` header.

### Behavior
```http
POST /onboarding/v1/cases
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "type": "individual", ... }
```

- **First Request**: Creates resource, returns `201 Created`
- **Subsequent Requests (same key + body)**: Returns cached `201` response
- **Same Key, Different Body**: Returns `409 Conflict`

### Storage
- Keys stored in Redis for 24 hours
- Namespace: `idempotency:{key}`

## Caching & Conditional Requests

### ETag Support
```http
GET /onboarding/v1/cases/uuid
ETag: "v1-abc123"
Last-Modified: Wed, 21 Oct 2025 14:30:00 GMT
```

### Conditional GET
```http
GET /onboarding/v1/cases/uuid
If-None-Match: "v1-abc123"

→ 304 Not Modified (if ETag matches)
→ 200 OK (if ETag differs)
```

### Conditional Update
```http
PUT /onboarding/v1/cases/uuid
If-Match: "v1-abc123"

→ 412 Precondition Failed (if ETag differs)
→ 200 OK (if ETag matches)
```

## Security Headers

### Request Headers
```http
Authorization: Bearer <JWT>
```

### Response Headers (automatic)
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Request-Id: <UUID>
```

## Rate Limiting

### Default Limits
- **Unauthenticated**: 100 req/sec per IP
- **Authenticated**: Based on token scope

### Response Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

### When Limited
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "name": "RateLimitExceeded",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "debug_id": "req-uuid"
}
```

## Versioning Strategy

### Approach
- **URL-based versioning**: `/v1`, `/v2`
- **Avoid breaking changes**: Prefer additive changes
- **Deprecation period**: 6 months minimum

### Breaking Changes
- Removing fields
- Changing field types
- Renaming fields
- Changing status codes

### Non-Breaking Changes (OK to add)
- New optional fields
- New endpoints
- New query parameters
- New response fields

## Async Operations

### Request
```http
POST /onboarding/v1/cases
Prefer: respond-async

→ 202 Accepted
Location: /onboarding/v1/operations/uuid
```

### Status Check
```http
GET /onboarding/v1/operations/uuid

{
  "id": "uuid",
  "status": "in_progress",
  "created_at": "2025-10-21T14:30:00Z",
  "links": {
    "self": "/onboarding/v1/operations/uuid",
    "result": "/onboarding/v1/cases/result-uuid"  # When complete
  }
}
```

## Best Practices

1. **Always validate input**: Use FluentValidation
2. **Return appropriate status codes**: Don't overuse 200
3. **Include request_id**: For tracing and debugging
4. **Log all errors**: With correlation IDs
5. **Document in OpenAPI**: Keep specs up to date
6. **Test error cases**: 4xx and 5xx scenarios
7. **Use Polly for resilience**: Timeouts, retries, circuit breakers
8. **Mask PII in logs**: Never log sensitive data
9. **Use UTC timestamps**: Avoid timezone ambiguity
10. **Version carefully**: Breaking changes require new version

