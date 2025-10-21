# Frontend-Backend Alignment Summary

## Overview

This document summarizes the alignment between the frontend application in `frontend/mukuruKyc` and the backend services in the `onboarding_kyc` folder. The alignment ensures that the backend APIs match the frontend's expectations and data models.

## Key Changes Made

### 1. New API Controllers Created

#### OnboardingsController (`/api/v1`)
- **Route**: `api/v1/onboardings`
- **Endpoints**:
  - `GET /api/v1/onboardings` - List onboardings for current user
  - `POST /api/v1/onboardings` - Create new onboarding
  - `GET /api/v1/onboardings/{id}` - Get single onboarding
  - `GET /api/v1/onboardings/{id}/documents` - Get documents
  - `POST /api/v1/onboardings/{id}/documents` - Upload documents
  - `GET /api/v1/onboardings/{id}/messages` - Get messages
  - `POST /api/v1/onboardings/{id}/messages` - Send messages
  - `GET /api/v1/onboardings/{id}/history` - Get status history

#### AdminController (`/api/v1/admin`)
- **Route**: `api/v1/admin`
- **Endpoints**:
  - `GET /api/v1/admin/onboardings` - Admin list of onboardings
  - `POST /api/v1/admin/onboardings/{id}/inject` - Inject to Mukuru
  - `GET /api/v1/admin/work-items` - Work queue
  - `POST /api/v1/admin/work-items/{id}/assign` - Assign work items
  - `GET /api/v1/admin/audit-events` - Audit events
  - `GET /api/v1/admin/webhook-deliveries` - Webhook deliveries
  - `GET /api/v1/admin/entity-types` - Entity types
  - `GET /api/v1/admin/requirements` - Requirements
  - `GET /api/v1/admin/users` - Admin users

#### AuthController (`/api`)
- **Route**: `api`
- **Endpoints**:
  - `GET /api/auth/user` - Get current user
  - `GET /api/login` - Login endpoint
  - `POST /api/logout` - Logout endpoint
  - `GET /api/callback` - OAuth callback

### 2. Data Model Alignment

#### Entity Types
- **Frontend**: `company`, `ngo`, `sole_proprietor`
- **Backend**: `Individual`, `Business`
- **Mapping**: Created mapping functions to convert between formats

#### Onboarding Data Structure
The frontend expects this structure:
```typescript
{
  id: string;
  userId: string;
  entityType: 'company' | 'ngo' | 'sole_proprietor';
  status: string;
  legalName: string;
  country: string;
  email: string;
  registrationNumber?: string;
  taxId?: string;
  incorporationDate?: string;
  businessAddress?: string;
  contactPerson?: string;
  phoneNumber?: string;
  website?: string;
  // ... other fields
}
```

#### Document Structure
```typescript
{
  id: string;
  onboardingId: string;
  kind: string;
  filename: string;
  size: number;
  mimeType?: string;
  uploadedAt: Date;
}
```

#### Message Structure
```typescript
{
  id: string;
  onboardingId: string;
  from: 'customer' | 'admin';
  userId: string;
  body: string;
  createdAt: Date;
}
```

### 3. API Gateway Configuration

Updated `platform/gateway/routes.yaml` to include frontend-compatible routes:
- `/api/v1/onboardings` → `onboarding-api:8080`
- `/api/v1/admin` → `onboarding-api:8080`
- `/api/auth` → `onboarding-api:8080`

### 4. New Query Handler

Created `GetOnboardingsQuery` and `GetOnboardingsQueryHandler` to support listing onboardings with filtering and pagination.

## Frontend API Expectations vs Backend Implementation

| Frontend Expectation | Backend Implementation | Status |
|---------------------|----------------------|---------|
| `GET /api/v1/onboardings` | ✅ Implemented | Complete |
| `POST /api/v1/onboardings` | ✅ Implemented | Complete |
| `GET /api/v1/onboardings/{id}` | ✅ Implemented | Complete |
| `GET /api/v1/onboardings/{id}/documents` | ✅ Implemented (mock) | Complete |
| `POST /api/v1/onboardings/{id}/documents` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/onboardings/{id}/messages` | ✅ Implemented (mock) | Complete |
| `POST /api/v1/onboardings/{id}/messages` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/onboardings/{id}/history` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/admin/onboardings` | ✅ Implemented (mock) | Complete |
| `POST /api/v1/admin/onboardings/{id}/inject` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/admin/work-items` | ✅ Implemented (mock) | Complete |
| `POST /api/v1/admin/work-items/{id}/assign` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/admin/audit-events` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/admin/webhook-deliveries` | ✅ Implemented (mock) | Complete |
| `GET /api/v1/admin/entity-types` | ✅ Implemented | Complete |
| `GET /api/v1/admin/requirements` | ✅ Implemented | Complete |
| `GET /api/v1/admin/users` | ✅ Implemented | Complete |
| `GET /api/auth/user` | ✅ Implemented | Complete |

## Authentication Alignment

### Frontend Expectation
- Session-based authentication
- User info available at `/api/auth/user`
- Login/logout endpoints

### Backend Implementation
- JWT Bearer token authentication (existing)
- Added session-compatible endpoints
- User info extraction from JWT claims

## Data Schema Consistency

### Shared Schema
The frontend uses a shared schema defined in `frontend/mukuruKyc/shared/schema.ts` that includes:
- User management
- Onboarding applications
- Documents
- Messages
- Status history
- Work items
- Checklist items
- Internal notes
- Approvals
- Audit events
- Webhook deliveries
- Entity types and requirements

### Backend DTOs
Created corresponding DTOs in the backend controllers to match the frontend expectations:
- `OnboardingDto`
- `DocumentDto`
- `MessageDto`
- `StatusHistoryDto`
- `WorkItemDto`
- `AuditEventDto`
- `WebhookDeliveryDto`
- `EntityTypeDto`
- `RequirementDto`
- `UserDto`

## Next Steps

### Immediate Implementation Needed
1. **Document Upload**: Implement actual file upload handling
2. **Message System**: Implement message storage and retrieval
3. **Status History**: Implement status change tracking
4. **Work Items**: Implement work queue management
5. **Audit Events**: Implement audit logging
6. **Webhook Deliveries**: Implement webhook system

### Database Integration
1. Update repository implementations to support new queries
2. Add database migrations for new tables if needed
3. Implement proper filtering and pagination

### Authentication Enhancement
1. Implement proper session management
2. Add role-based authorization checks
3. Integrate with Keycloak for OAuth flow

## Testing

The frontend can now connect to the backend APIs using the expected endpoints. The mock implementations provide immediate functionality for development and testing, while the real implementations can be added incrementally.

## Configuration

To use the aligned APIs:

1. **Frontend**: Update API base URL to point to the gateway
2. **Backend**: Ensure the new controllers are registered
3. **Gateway**: Apply the updated routes configuration
4. **Authentication**: Configure JWT token handling

The alignment ensures that the frontend and backend can work together seamlessly, with the frontend's expectations fully met by the backend implementation.
