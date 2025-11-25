# Messaging API Alignment Check

## ✅ Routes are Correctly Aligned

### Frontend → Proxy → Backend Flow

1. **Frontend calls:**
   - `/api/proxy/api/v1/messages/threads/my?page=1&pageSize=20`
   - `/api/proxy/api/v1/messages/unread/count`

2. **Proxy routes to:**
   - `http://localhost:8001/api/v1/messages/threads/my?page=1&pageSize=20`
   - `http://localhost:8001/api/v1/messages/unread/count`

3. **Backend endpoints (MessagesController.cs):**
   - `[HttpGet("threads/my")]` - Line 111
   - `[HttpGet("unread/count")]` - Line 144

✅ **All routes match correctly!**

## ✅ User Headers are Being Set

### Frontend (api.ts)
- Fetches session from `/api/auth/session`
- Sets headers: `X-User-Email`, `X-User-Name`, `X-User-Role`, `X-User-Id`
- Uses `generateUserIdFromEmail()` to create consistent GUID

### Proxy (route.ts)
- Forwards user headers: `X-User-Id`, `X-User-Email`, `X-User-Name`, `X-User-Role`
- Injects Authorization header from Redis

### Backend (MessagesController.cs)
- Extracts user from JWT claims OR headers
- `GetCurrentUserId()` checks:
  1. JWT claims (email, preferred_username, upn)
  2. `X-User-Id` header
  3. Falls back to `Guid.Empty` if neither found

## ⚠️ Potential Issues

### 500 Internal Server Error Causes

1. **User ID is Guid.Empty**
   - If session fetch fails, headers aren't set
   - Backend gets `Guid.Empty` which might cause issues
   - **Fix:** Added better logging to track when headers are missing

2. **Database Connection Issue**
   - Backend might not be able to connect to database
   - Check backend logs for connection errors

3. **Missing User Context**
   - JWT token might not contain email claim
   - Backend can't extract user from token
   - Headers might not be forwarded correctly

## 🔍 Debugging Steps

1. **Check Browser Console:**
   - Look for `[API] User headers set:` logs
   - Verify headers are being set before request

2. **Check Proxy Logs:**
   - Look for `[Proxy] Messaging request` logs
   - Verify `User headers received:` shows the headers

3. **Check Backend Logs:**
   - Look for errors in `MessagesController`
   - Check if `GetCurrentUserId()` is returning `Guid.Empty`
   - Look for database connection errors

4. **Test Backend Directly:**
   ```bash
   # Without auth (should return 401)
   curl http://localhost:8001/api/v1/messages/threads/my
   
   # With auth token (check backend logs for errors)
   curl -H "Authorization: Bearer <token>" \
        -H "X-User-Email: test@example.com" \
        -H "X-User-Id: <guid>" \
        http://localhost:8001/api/v1/messages/threads/my
   ```

## 📝 Recent Changes

1. ✅ Added better logging in `api.ts` to track user header setting
2. ✅ Added debug logging in proxy route for messaging endpoints
3. ✅ SignalR connection failures are now handled gracefully (non-blocking)

## 🎯 Next Steps

1. **Check backend logs** when 500 errors occur
2. **Verify session is available** in browser (check `/api/auth/session`)
3. **Ensure backend database is running** and accessible
4. **Check if JWT token contains email claim** in Keycloak configuration

