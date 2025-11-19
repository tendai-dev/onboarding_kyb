# Remaining Work - Secure Token Storage Implementation

## ✅ Completed
- Redis session storage utilities created
- Admin NextAuth updated to store tokens in Redis
- Partner NextAuth implemented with Keycloak
- Both proxies updated to inject tokens from Redis
- Partner AuthContext updated to use NextAuth
- Partner useRequireAuth updated to use NextAuth
- Both SignalR services updated (no longer use accessToken)
- Frontend API clients updated to not use tokens

## ⚠️ Remaining Work

### 1. Admin Portal - API Routes (HIGH PRIORITY)
Many admin API routes still use `session.accessToken` directly. They need to be updated to use `getServerAccessToken()` helper.

**Files to update:**
- `admin/src/app/api/migrations/[...path]/route.ts`
- `admin/src/app/api/migrations/route.ts`
- `admin/src/app/api/workqueue/[...path]/route.ts`
- `admin/src/app/api/workqueue/route.ts`
- `admin/src/app/api/dashboard/route.ts`
- `admin/src/app/api/risk/[...path]/route.ts`
- `admin/src/app/api/applications/[id]/route.ts`
- `admin/src/app/api/applications/[id]/status/route.ts`
- `admin/src/app/api/rules-and-permissions/[...path]/route.ts`
- `admin/src/app/api/trends/route.ts`
- `admin/src/app/api/entity-type-distribution/route.ts`

**Pattern to follow:**
```typescript
import { getServerAccessToken } from '@/lib/get-server-token';

// Replace:
if (session?.accessToken) {
  headers['Authorization'] = `Bearer ${session.accessToken}`;
}

// With:
const accessToken = await getServerAccessToken(request);
if (accessToken) {
  headers['Authorization'] = `Bearer ${accessToken}`;
}
```

### 2. Admin Portal - Client-Side Services (MEDIUM PRIORITY)
These services fetch session from `/api/auth/session` and try to use `accessToken`. Since tokens are no longer in the session, these should be updated to go through the proxy (which handles tokens automatically).

**Files to update:**
- `admin/src/lib/workQueueApi.ts`
- `admin/src/lib/applicationsApi.ts`
- `admin/src/services/riskApi.ts`
- `admin/src/services/entityConfigApi.ts`
- `admin/src/lib/messagingApi.ts`
- `admin/src/services/checklistApi.ts`
- `admin/src/services/rulesAndPermissionsApi.ts`
- `admin/src/services/migrationApi.ts`
- `admin/src/services/auditLogApi.ts`

**Note:** These are client-side services. They should:
1. Remove `session.accessToken` checks
2. Ensure all requests go through `/api/proxy/*` 
3. The proxy will automatically inject tokens

### 3. Partner Portal - Legacy Auth Code (LOW PRIORITY)
Old authentication code still exists but is no longer used. Can be removed or deprecated:

- `partner/src/lib/auth/session.ts` - Old localStorage-based auth functions
- `partner/src/lib/auth/pkce.ts` - Old PKCE flow (if not needed)
- `partner/src/lib/auth/persist.ts` - Token persistence utilities
- `partner/src/app/auth/callback/page.tsx` - Old callback page (if NextAuth handles this)

**Note:** Check if these are still referenced anywhere before removing.

### 4. Environment Variables
Ensure these are set in both portals:

**Admin Portal:**
```env
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=<generate-secure-secret>
NEXTAUTH_URL=http://localhost:3001
```

**Partner Portal:**
```env
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=<generate-secure-secret>
NEXTAUTH_URL=http://localhost:3000
KEYCLOAK_CLIENT_ID=kyb-connect-portal
KEYCLOAK_CLIENT_SECRET=<your-secret>
KEYCLOAK_ISSUER=https://keycloak-staging.app-stg.mukuru.io/realms/mukuru
```

### 5. Testing Checklist
- [ ] Admin login flow works
- [ ] Partner login flow works
- [ ] Admin API calls work (proxy injects tokens)
- [ ] Partner API calls work (proxy injects tokens)
- [ ] Token refresh works (server-side)
- [ ] Logout clears Redis sessions
- [ ] SignalR connections work
- [ ] No tokens visible in browser DevTools

## Quick Fix Script

To quickly update all admin API routes, you can use this pattern:

```typescript
// At the top of each route file:
import { getServerAccessToken } from '@/lib/get-server-token';

// In the route handler:
const accessToken = await getServerAccessToken(request);
if (accessToken) {
  headers['Authorization'] = `Bearer ${accessToken}`;
}
```

Remove all `session?.accessToken` checks and replace with the above pattern.

