# Sentry Error Monitoring Setup

## Overview
Sentry has been integrated into the admin portal to monitor and track errors, replacing console.error/warn calls with proper error reporting.

## Configuration

### Environment Variables
Add these to your `.env` file:

```bash
# Sentry Error Monitoring Configuration
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_DSN=your-sentry-dsn-here
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_RELEASE=
NEXT_PUBLIC_SENTRY_RELEASE=
# Set to "true" to enable Sentry in development
SENTRY_ENABLED=false
NEXT_PUBLIC_SENTRY_ENABLED=false
```

### Getting Your Sentry DSN
1. Go to https://sentry.io and create an account/project
2. Select "Next.js" as your platform
3. Copy the DSN from your project settings
4. Add it to your `.env` file

## Files Created

1. **sentry.client.config.ts** - Client-side Sentry configuration
2. **sentry.server.config.ts** - Server-side Sentry configuration
3. **sentry.edge.config.ts** - Edge runtime Sentry configuration
4. **instrumentation.ts** - Next.js instrumentation hook
5. **src/lib/sentry.ts** - Sentry utility functions
6. **src/lib/sentry-client.ts** - Client-side Sentry utilities
7. **src/components/ErrorBoundary.tsx** - React error boundary component

## Usage

### Server-Side (API Routes)
```typescript
import { reportError, reportApiError } from '@/lib/sentry';

// For general errors
try {
  // ... code
} catch (error) {
  reportError(error, {
    tags: { error_type: 'my_operation' },
    extra: { context: 'additional info' },
    level: 'error',
  });
}

// For API errors
reportApiError(error, {
  endpoint: '/api/endpoint',
  method: 'GET',
  statusCode: 500,
  responseBody: 'error details',
});
```

### Client-Side (React Components)
```typescript
import { clientSentry } from '@/lib/sentry-client';

try {
  // ... code
} catch (error) {
  clientSentry.reportError(error, {
    tags: { error_type: 'my_operation' },
    level: 'error',
  });
}
```

### Error Boundary
The ErrorBoundary component is already integrated in `src/app/providers.tsx`. It will automatically catch React component errors and report them to Sentry.

## Files Updated

### Core Files (Completed)
- ✅ `src/lib/auth.ts` - Token storage/refresh errors
- ✅ `src/lib/redis-session.ts` - Redis connection errors
- ✅ `src/lib/get-server-token.ts` - Token retrieval errors
- ✅ `src/app/api/auth/logout/route.ts` - Logout errors
- ✅ `src/app/api/proxy/[...path]/route.ts` - Proxy errors
- ✅ `src/app/api/dashboard/route.ts` - Dashboard API errors
- ✅ `src/app/api/workqueue/route.ts` - Work queue errors
- ✅ `src/app/api/risk/[...path]/route.ts` - Risk API errors
- ✅ `src/app/messages/page.tsx` - Messages page errors (partial)

### Remaining Files to Update

#### API Routes
- `src/app/api/workqueue/[...path]/route.ts`
- `src/app/api/migrations/[...path]/route.ts`
- `src/app/api/migrations/route.ts`
- `src/app/api/applications/[id]/route.ts`
- `src/app/api/applications/[id]/status/route.ts`
- `src/app/api/applications/route.ts`
- `src/app/api/trends/route.ts`
- `src/app/api/entity-type-distribution/route.ts`
- `src/app/api/rules-and-permissions/[...path]/route.ts`
- `src/app/api/checklist/[...path]/route.ts`
- `src/app/api/proxy-document/route.ts`

#### Client-Side Services
- `src/lib/messagingApi.ts` - Replace console.error/warn
- `src/lib/applicationsApi.ts` - Replace console.error/warn
- `src/lib/workQueueApi.ts` - Replace console.error/warn
- `src/services/entityConfigApi.ts` - Replace console.error/warn
- `src/services/riskApi.ts` - Replace console.error/warn
- `src/services/checklistApi.ts` - Replace console.error/warn
- `src/services/rulesAndPermissionsApi.ts` - Replace console.error/warn
- `src/services/auditLogApi.ts` - Replace console.error/warn
- `src/services/migrationApi.ts` - Replace console.error/warn

#### React Components
- `src/app/messages/page.tsx` - Complete remaining console.error/warn replacements
- Other page components with error handling

## Pattern for Updating Files

### For API Routes:
```typescript
// Add import
import { reportApiError } from '@/lib/sentry';

// Replace console.error
// Before:
console.error('Error:', error);

// After:
reportApiError(error, {
  endpoint: url,
  method: req.method,
  statusCode: response?.status,
  responseBody: errorText,
}, {
  tags: { error_type: 'api_name' },
});
```

### For Client-Side Code:
```typescript
// Add import at top
import { clientSentry } from '@/lib/sentry-client';

// Replace console.error
// Before:
catch (err) {
  console.error('Error:', err);
}

// After:
catch (err) {
  clientSentry.reportError(err, {
    tags: { error_type: 'operation_name' },
    level: 'error',
  });
}
```

## Features

- ✅ Automatic error capture (unhandled exceptions)
- ✅ API error tracking with context
- ✅ React error boundaries
- ✅ User context tracking
- ✅ Breadcrumb tracking
- ✅ Source map support (production)
- ✅ Performance monitoring
- ✅ Session replay (masked for privacy)

## Next Steps

1. **Set up Sentry account** and get DSN
2. **Add environment variables** to `.env`
3. **Update remaining files** using the patterns above
4. **Test error reporting** by triggering test errors
5. **Configure alerts** in Sentry dashboard

## Testing

To test Sentry integration:
1. Set `SENTRY_ENABLED=true` in development
2. Trigger a test error
3. Check Sentry dashboard for the error

## Notes

- Sentry is disabled in development by default (set `SENTRY_ENABLED=true` to enable)
- Errors are filtered to exclude browser extensions and expected network errors
- User context is automatically set from NextAuth session
- All errors include relevant tags and context for easier debugging

