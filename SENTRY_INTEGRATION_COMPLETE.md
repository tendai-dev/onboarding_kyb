# Sentry Integration - Complete Summary

## Overview

Sentry error monitoring has been integrated across both the frontend (Next.js/TypeScript) and backend (C# .NET) services. This provides comprehensive error tracking, monitoring, and alerting capabilities.

## Frontend Integration (Admin Portal)

### ✅ Completed

1. **Sentry SDK Installation**
   - Installed `@sentry/nextjs` package
   - Configured for client, server, and edge environments

2. **Configuration Files**
   - `sentry.client.config.ts` - Client-side configuration
   - `sentry.server.config.ts` - Server-side configuration
   - `sentry.edge.config.ts` - Edge runtime configuration
   - `instrumentation.ts` - Next.js instrumentation hook
   - `next.config.js` - Wrapped with `withSentryConfig`

3. **Core Utilities**
   - `src/lib/sentry.ts` - Server-side error reporting utilities
   - `src/lib/sentry-client.ts` - Client-side error reporting utilities
   - `src/components/ErrorBoundary.tsx` - React error boundary component

4. **Updated Files**
   - Core authentication and token management
   - API proxy routes
   - Client-side API services (applications, messaging, work queue, entity config)
   - Messages page
   - Error handlers throughout the app

5. **User Context Tracking**
   - `src/app/sentry-init.tsx` - Automatically sets user context from NextAuth session
   - Integrated into root layout

### 📋 Remaining Frontend Files

See `admin/SENTRY_FRONTEND_UPDATE_SUMMARY.md` for a complete list of remaining files that need updates. The pattern is established and can be applied consistently.

## Backend Integration (C# Services)

### ✅ Completed Services

1. **onboarding-api**
   - Sentry NuGet package added
   - Configured in `Program.cs`
   - Global exception filter updated with Sentry reporting
   - Database migration errors tracked

2. **entity-configuration-service**
   - Sentry NuGet package added
   - Configured in `Program.cs`
   - Error handler endpoint updated with Sentry reporting

3. **risk-service**
   - Sentry NuGet package added
   - Configured in `Program.cs`
   - Database migration and fatal errors tracked

4. **document-service**
   - Sentry NuGet package added
   - Configured in `Program.cs`
   - Database migration errors tracked

### 📋 Remaining Backend Services

See `services/SENTRY_BACKEND_SETUP.md` for detailed instructions on integrating the remaining services:
- `auditlog-service`
- `authentication-service`
- `checklist-service`
- `compliance-refresh-job`
- `messaging-service`
- `notification-service`
- `outbox-relay`
- `projections-api`
- `webhook-dispatcher`
- `work-queue-service`

### Shared Helper

- `services/shared/SentryExtensions.cs` - Shared Sentry configuration helper (can be referenced if shared project is set up)

## Configuration

### Environment Variables

**Frontend (Admin Portal):**
```bash
NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
SENTRY_DSN=your-dsn-here
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_RELEASE=version
NEXT_PUBLIC_SENTRY_RELEASE=version
SENTRY_ENABLED=true
NEXT_PUBLIC_SENTRY_ENABLED=true
```

**Backend (C# Services):**
```bash
SENTRY_DSN=your-dsn-here
SENTRY_ENABLED=true
SENTRY_RELEASE=version
SERVICE_NAME=your-service-name
```

### appsettings.json (Backend)

```json
{
  "Sentry": {
    "Dsn": "YOUR_SENTRY_DSN",
    "Enabled": true,
    "TracesSampleRate": 0.1
  }
}
```

## Features Enabled

- ✅ Automatic error capture (unhandled exceptions)
- ✅ API error tracking with full context
- ✅ React error boundaries
- ✅ User context tracking (from NextAuth)
- ✅ Breadcrumb tracking
- ✅ Source maps (production)
- ✅ Performance monitoring
- ✅ Session replay (privacy-masked)
- ✅ Custom tags and context
- ✅ Error filtering (sensitive data removed)

## Usage Patterns

### Frontend - Client-Side

```typescript
if (typeof window !== 'undefined') {
  const { clientSentry } = await import('../lib/sentry-client');
  clientSentry.reportError(error, {
    tags: { error_type: 'component_name', operation: 'operation_name' },
    level: 'error',
  });
}
```

### Frontend - Server-Side API Routes

```typescript
import { reportApiError } from '@/lib/sentry';

reportApiError(error, {
  endpoint: url,
  method: 'GET',
  statusCode: response?.status,
}, {
  tags: { error_type: 'api_route' },
});
```

### Backend - C# Services

```csharp
using Sentry;

SentrySdk.WithScope(scope =>
{
    scope.SetTag("endpoint", context.Request.Path);
    scope.SetTag("method", context.Request.Method);
    scope.SetExtra("user", context.User?.Identity?.Name ?? "anonymous");
    SentrySdk.CaptureException(exception);
});
```

## Next Steps

1. **Get Sentry DSN**
   - Create account at https://sentry.io
   - Create Next.js and .NET projects
   - Copy DSNs

2. **Configure Environment Variables**
   - Add DSNs to all environment files
   - Set `SENTRY_ENABLED=true` to activate

3. **Complete Remaining Services**
   - Follow patterns in `SENTRY_BACKEND_SETUP.md`
   - Update remaining frontend files per `SENTRY_FRONTEND_UPDATE_SUMMARY.md`

4. **Test Integration**
   - Trigger test errors in both frontend and backend
   - Verify errors appear in Sentry dashboard
   - Check that user context is properly set

5. **Set Up Alerts**
   - Configure Sentry alerts for critical errors
   - Set up notification channels (email, Slack, etc.)

## Documentation

- `admin/SENTRY_SETUP.md` - Frontend Sentry setup details
- `admin/SENTRY_FRONTEND_UPDATE_SUMMARY.md` - Remaining frontend files
- `services/SENTRY_BACKEND_SETUP.md` - Backend integration guide

## Notes

- Sentry respects the `SENTRY_ENABLED` flag - set to `false` to disable
- In development, errors still log to console/Serilog even if Sentry is disabled
- Sensitive data (Authorization headers, cookies) is automatically filtered
- Source maps are configured for production debugging
- User context is automatically set from NextAuth sessions

