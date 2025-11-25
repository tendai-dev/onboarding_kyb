# Remaining Tasks to Complete SignalR and Messaging Fixes

## ✅ Completed
1. ✅ Updated SignalR service to connect directly to backend (bypassing Next.js proxy)
2. ✅ Enhanced error handling in `GetCurrentUserId()` with better logging and fallbacks
3. ✅ Fixed user ID generation consistency between frontend and backend
4. ✅ Updated `env.example` with `NEXT_PUBLIC_BACKEND_URL`

## 🔧 Still Required

### 1. **Rebuild Backend Docker Image** (CRITICAL)
   The backend code changes haven't been applied yet because the Docker container is running the old compiled code.

   **Action Required:**
   ```bash
   cd services/onboarding-api
   docker-compose build onboarding-api
   docker-compose restart onboarding-api
   ```
   
   Or if using docker directly:
   ```bash
   docker build -t onboarding-api ./services/onboarding-api
   docker restart onboarding-api
   ```

### 2. **Update CORS Configuration for WebSocket Support** (IMPORTANT)
   The current CORS configuration allows all origins, but SignalR WebSocket connections may need explicit WebSocket support.

   **Check:** `services/onboarding-api/src/Presentation/Program.cs` line 488
   - Current: `AllowAnyOrigin()` - should work but may need explicit WebSocket headers
   - May need to add `.AllowCredentials()` if cookies are used

### 3. **Set Environment Variable** (OPTIONAL)
   The frontend will default to `http://localhost:8001` if `NEXT_PUBLIC_BACKEND_URL` is not set.
   
   **Action (if needed):**
   - Add `NEXT_PUBLIC_BACKEND_URL=http://localhost:8001` to `partner/.env.local` (optional, already defaults to this)

### 4. **Test SignalR Connection**
   After rebuilding the backend:
   1. Open browser console
   2. Navigate to `/partner/messages`
   3. Check for SignalR connection logs
   4. Should see: `[SignalR] Connected to messaging hub` instead of 404 errors

### 5. **Verify 500 Errors are Fixed**
   After rebuilding the backend:
   1. Check browser console for API calls to `/api/v1/messages/unread/count`
   2. Should no longer see 500 errors
   3. Backend logs should show debug information about user ID resolution

## 🔍 Debugging Steps

If issues persist after rebuilding:

1. **Check Backend Logs:**
   ```bash
   docker logs onboarding-api --tail 50 -f
   ```
   Look for:
   - SignalR connection attempts
   - User ID resolution logs (new debug messages)
   - Any FormatException errors

2. **Check Frontend Console:**
   - SignalR connection errors
   - API request errors
   - User header values being sent

3. **Test Direct Backend Connection:**
   ```bash
   curl -X POST "http://localhost:8001/api/v1/messages/hub/negotiate?negotiateVersion=1" \
     -H "X-User-Email: test@example.com" \
     -H "X-User-Id: 00000000-0000-5000-8000-00000ee22d5d"
   ```
   Should return SignalR negotiation response (not 404)

4. **Check CORS Headers:**
   ```bash
   curl -I -X OPTIONS "http://localhost:8001/api/v1/messages/hub" \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET"
   ```
   Should return CORS headers allowing the origin

## 📝 Summary

**Critical:** Rebuild the backend Docker image to apply code changes.

**Important:** Verify CORS allows WebSocket connections from the frontend origin.

**Optional:** Set `NEXT_PUBLIC_BACKEND_URL` environment variable (already defaults correctly).

