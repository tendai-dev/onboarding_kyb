# Sentry Frontend Integration - Update Summary

## Completed Files

The following frontend files have been updated to use Sentry error reporting:

### Core Files
- ✅ `src/lib/auth.ts` - Token storage/refresh errors
- ✅ `src/lib/redis-session.ts` - Redis connection errors
- ✅ `src/lib/get-server-token.ts` - Token retrieval errors
- ✅ `src/lib/sentry.ts` - Server-side Sentry utilities
- ✅ `src/lib/sentry-client.ts` - Client-side Sentry utilities
- ✅ `src/components/ErrorBoundary.tsx` - React error boundary

### API Routes
- ✅ `src/app/api/auth/logout/route.ts` - Logout errors
- ✅ `src/app/api/proxy/[...path]/route.ts` - Proxy errors
- ✅ `src/app/api/dashboard/route.ts` - Dashboard API errors
- ✅ `src/app/api/workqueue/route.ts` - Work queue errors
- ✅ `src/app/api/risk/[...path]/route.ts` - Risk API errors

### Client-Side Services
- ✅ `src/lib/applicationsApi.ts` - Applications API errors
- ✅ `src/lib/messagingApi.ts` - Messaging API errors (partial)
- ✅ `src/lib/workQueueApi.ts` - Work queue API errors
- ✅ `src/services/entityConfigApi.ts` - Entity config API errors
- ✅ `src/services/migrationApi.ts` - Migration API (token leak fixed)

### Pages
- ✅ `src/app/messages/page.tsx` - Messages page errors

## Remaining Files to Update

The following files still contain `console.error` or `console.warn` calls that should be replaced with Sentry:

### API Routes
- `src/app/api/entity-type-distribution/route.ts`
- `src/app/api/trends/route.ts`
- `src/app/api/applications/[id]/status/route.ts`
- `src/app/api/applications/[id]/route.ts`
- `src/app/api/migrations/[...path]/route.ts`
- `src/app/api/migrations/route.ts`
- `src/app/api/workqueue/[...path]/route.ts`
- `src/app/api/rules-and-permissions/[...path]/route.ts`
- `src/app/api/checklist/[...path]/route.ts`
- `src/app/api/proxy-document/route.ts`
- `src/app/api/applications/route.ts`

### Services
- `src/services/rulesAndPermissionsApi.ts`
- `src/services/riskApi.ts`
- `src/lib/signalRService.ts`

### Pages
- `src/app/work-queue/page.tsx`
- `src/app/data-migration/page.tsx`
- `src/app/refreshes/page.tsx`
- `src/app/approvals/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/entity-types/page.tsx`
- `src/app/risk-review/page.tsx`
- `src/app/applications/page.tsx`
- `src/app/review/[id]/page.tsx`
- `src/app/applications/[id]/page.tsx`
- `src/app/documents/page.tsx`
- `src/app/checklists/page.tsx`
- `src/app/entity-types/create/page.tsx`
- `src/app/requirements/edit/[id]/page.tsx`
- `src/app/rules-and-permissions/page.tsx`
- `src/app/entity-types/edit/[id]/page.tsx`
- `src/app/wizard-configurations/page.tsx`
- `src/app/wizard-configurations/edit/[id]/page.tsx`
- `src/app/wizard-configurations/create/page.tsx`
- `src/app/requirements/create/page.tsx`
- `src/app/requirements/page.tsx`
- `src/app/audit-log/page.tsx`

### Components
- `src/components/DocumentViewer.tsx`
- `src/components/DynamicFieldRenderer.tsx`
- `src/utils/validation.ts`
- `src/lib/entitySchemaRenderer.ts`
- `src/lib/documentUpload.ts`
- `src/components/EnhancedContextualMessaging.tsx`
- `src/components/EnhancedDynamicForm.tsx`
- `src/lib/messageTemplates.ts`
- `src/lib/pushNotifications.ts`
- `src/contexts/I18nContext.tsx`
- `src/components/EnhancedUX.tsx`
- `src/components/EnhancedMessaging.tsx`
- `src/components/OCRIntegration.tsx`
- `src/components/EnhancedAdminInterface.tsx`
- `src/components/PerformanceOptimizations.tsx`
- `src/components/DigitalSignature.tsx`
- `src/components/ServiceWorkerRegistration.tsx`

### Hooks
- `src/hooks/usePWA.tsx`
- `src/hooks/useOffline.ts`
- `src/hooks/useFormPersistence.ts`

### Utilities
- `src/lib/googleDriveUpload.ts`

## Update Pattern

For **client-side code** (React components, hooks, client-side services):

```typescript
// Replace:
console.error('Error message:', error);
// or
console.warn('Warning message:', error);

// With:
if (typeof window !== 'undefined') {
  const { clientSentry } = await import('../lib/sentry-client');
  clientSentry.reportError(error, {
    tags: { error_type: 'component_name', operation: 'operation_name' },
    level: 'error', // or 'warning'
  });
}
```

For **server-side API routes**:

```typescript
// Replace:
console.error('Error message:', error);

// With:
import { reportApiError } from '@/lib/sentry';

reportApiError(error, {
  endpoint: url,
  method: 'GET',
  statusCode: response?.status,
  responseBody: await response?.text(),
}, {
  tags: { error_type: 'api_route_name' },
});
```

## Notes

- Use dynamic imports for client-side Sentry to ensure it's only loaded in the browser
- Always check `typeof window !== 'undefined'` before importing client-side Sentry
- For API routes, use `reportApiError` which includes endpoint and method context
- Keep `console.error` in development mode for local debugging if needed
- Use appropriate error levels: `'error'` for exceptions, `'warning'` for recoverable issues

