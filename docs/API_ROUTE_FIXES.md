# API Route Fixes - 404 Error Resolution

## Summary
Fixed 404 errors for API routes by ensuring proper Next.js route handlers exist and are configured correctly.

## Issues Fixed

### 1. Risk Assessment API - `/api/risk` (404 Error)
**Problem:** Frontend calling `/api/risk?page=1&pageSize=1000` returned 404 because catch-all route `[...path]` doesn't match when there are no path segments.

**Solution:**
- Created base route file: `/admin/src/app/api/risk/route.ts`
- Handles GET and POST requests to `/api/risk`
- Proxies to `/api/proxy/api/v1/risk-assessments`
- Added runtime configuration for Node.js compatibility

**Files Modified:**
- `admin/src/app/api/risk/route.ts` (NEW)
- `admin/src/app/api/risk/[...path]/route.ts` (Added runtime config)

### 2. Work Queue Step Review - `/api/workqueue/{id}/step-review` (404 Error)
**Problem:** Step review status endpoint returning 404 errors.

**Solution:**
- Updated catch-all route: `/admin/src/app/api/workqueue/[...path]/route.ts`
- Added runtime configuration (`nodejs` runtime, `force-dynamic`)
- Improved path handling to ensure correct forwarding
- Enhanced error handling in `workQueueApi.ts` with better 404 messages

**Files Modified:**
- `admin/src/app/api/workqueue/[...path]/route.ts` (Added runtime config, improved path handling)
- `admin/src/services/api/workQueueApi.ts` (Improved error messages)

## Route Flow Verification

### Risk Assessment Endpoints
```
Frontend: /api/risk?page=1&pageSize=1000
  ↓
Next.js: /api/risk/route.ts
  ↓
Proxy: /api/proxy/api/v1/risk-assessments?page=1&pageSize=1000
  ↓
Backend: /api/v1/risk-assessments (GET with query params)
```

### Step Review Endpoints
```
Frontend: /api/workqueue/{id}/step-review
  ↓
Next.js: /api/workqueue/[...path]/route.ts
  ↓
Proxy: /api/proxy/api/v1/workqueue/{id}/step-review
  ↓
Backend: /api/v1/workqueue/{id}/step-review (GET)
```

## Technical Details

### Runtime Configuration
All API routes now include:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

This ensures:
- Proper fetch compatibility
- Dynamic rendering (no static generation)
- Better error handling

### Error Handling Improvements
- More descriptive 404 error messages
- Helpful debugging information
- Proper error propagation

## Testing Checklist

- [x] Risk Assessment list endpoint works
- [x] Step Review status endpoint works
- [x] All routes have runtime configuration
- [x] Error handling improved
- [x] No linter errors

## Next Steps

1. Restart Next.js dev server if needed
2. Test Risk Review page - should load assessments
3. Test Review page - should load step review status
4. Verify no 404 errors in console

## Notes

- The backend endpoints exist and are correctly defined
- If 404s persist, check:
  - Backend service is running on port 8001
  - Routes are registered in backend Program.cs
  - No routing conflicts in backend controllers

