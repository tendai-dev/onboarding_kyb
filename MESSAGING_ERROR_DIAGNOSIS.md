# Messaging API 500 Error Diagnosis

## Current Status

**Frontend:** ✅ Correctly configured
- User headers are being set correctly
- API routes are aligned
- Proxy is forwarding requests correctly

**Backend:** ❌ Returning 500 Internal Server Error
- Generic error message hides the actual exception
- Likely database connection or query issue

## Root Cause Analysis

### What's Happening:

1. **Frontend** → Calls `/api/proxy/api/v1/messages/threads/my`
2. **Proxy** → Forwards to `http://localhost:8001/api/v1/messages/threads/my`
3. **Backend** → Tries to query `messaging.message_threads` table
4. **Error** → Returns 500 (exception caught by GlobalExceptionFilter)

### Most Likely Causes:

1. **Backend not restarted** - Still using old connection string
   - Old: `Host=localhost;Database=onboarding_dev` (no port, wrong database)
   - New: `Host=localhost;Port=5433;Database=kyb_case` (correct database with tables)

2. **Database connection failure** - Can't connect to PostgreSQL
   - Connection string mismatch
   - Database server not running
   - Wrong credentials

3. **Schema/Table missing** - Messaging schema doesn't exist
   - But migrations say "up to date" - so this is less likely

## What I've Fixed

1. ✅ Updated `appsettings.Development.json` to use `kyb_case` on port 5433
2. ✅ Updated `appsettings.json` (base config) to use `kyb_case` on port 5433
3. ✅ Verified migrations are up to date for messaging schema
4. ✅ Enhanced error handling to show exception details in development mode

## Required Action

**The backend API MUST be restarted** to pick up the new connection string.

### How to Restart:

1. **Find the backend process:**
   ```bash
   # Look for the process running on port 8001
   lsof -i :8001
   # Or check running dotnet processes
   ps aux | grep "dotnet.*onboarding"
   ```

2. **Stop the backend:**
   - If running in a terminal: Press `Ctrl+C`
   - If running as a service: Stop the service
   - If running in Docker: `docker stop <container>`

3. **Restart the backend:**
   ```bash
   cd services/onboarding-api/src/Presentation
   dotnet run
   ```
   
   Or if using a script:
   ```bash
   # Check for start scripts
   ls services/onboarding-api/*.sh
   ```

4. **Verify it's working:**
   ```bash
   curl http://localhost:8001/api/v1/messages/threads/my?page=1&pageSize=20 \
     -H "X-User-Email: tendai@kurasika.tech" \
     -H "X-User-Id: 00000000-0000-5000-8000-00000ee22d5d" \
     -H "X-User-Name: Tendai Gatahwa" \
     -H "X-User-Role: Applicant"
   ```

   **Expected after restart:** `{"items":[],"totalCount":0,"page":1,"pageSize":20}`

## SignalR 404 (Non-Critical)

The SignalR 404 errors are **expected and non-critical**:
- SignalR hub is not configured in the backend
- Messaging will work without real-time updates
- Frontend handles this gracefully

## After Restart

Once the backend is restarted:
- ✅ It will use the correct database (`kyb_case` on port 5433)
- ✅ It will find the messaging tables
- ✅ The 500 errors should stop
- ✅ Messaging endpoints will return data (or empty arrays if no messages exist)

## Debugging Tips

If errors persist after restart:

1. **Check backend logs** - Look for database connection errors
2. **Verify database is running:**
   ```bash
   # Test connection
   psql -h localhost -p 5433 -U postgres -d kyb_case -c "SELECT 1;"
   ```

3. **Check if messaging schema exists:**
   ```bash
   psql -h localhost -p 5433 -U postgres -d kyb_case -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'messaging';"
   ```

4. **Check if tables exist:**
   ```bash
   psql -h localhost -p 5433 -U postgres -d kyb_case -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'messaging';"
   ```

