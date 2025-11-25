# Messaging Database Connection Fix

## ✅ What Was Fixed

1. **Database Connection String Alignment**
   - Updated `appsettings.Development.json` to use the same database as migrations
   - Changed from: `Host=localhost;Database=onboarding_dev;Username=postgres;Password=postgres`
   - Changed to: `Host=localhost;Port=5433;Database=kyb_case;Username=postgres;Password=postgres`

2. **Migrations Configuration**
   - Updated `src/Migrations/appsettings.json` to use `kyb_case` database
   - Verified migrations are up to date for messaging schema

3. **Database Tables**
   - Messaging tables exist in `kyb_case` database:
     - `messaging.message_threads`
     - `messaging.messages`
   - Migrations confirmed: "messaging schema is up to date"

## ⚠️ Action Required

**The backend API needs to be restarted** to pick up the new connection string from `appsettings.Development.json`.

### Steps to Restart:

1. Stop the currently running backend API (if running)
2. Restart the backend API - it will now use the correct database (`kyb_case` on port 5433)
3. The messaging endpoints should now work correctly

### Verify the Fix:

After restarting, test the messaging endpoints:
```bash
curl -X GET "http://localhost:8001/api/v1/messages/threads/my?page=1&pageSize=20" \
  -H "X-User-Email: tendai@kurasika.tech" \
  -H "X-User-Id: 00000000-0000-5000-8000-00000ee22d5d" \
  -H "X-User-Name: Tendai Gatahwa" \
  -H "X-User-Role: Applicant"
```

Expected response: `{"items":[],"totalCount":0,"page":1,"pageSize":20}` (empty list is OK if no threads exist)

## Database Configuration Summary

- **Database**: `kyb_case`
- **Host**: `localhost`
- **Port**: `5433`
- **Username**: `postgres`
- **Password**: `postgres`
- **Schema**: `messaging`

## Files Modified

1. `services/onboarding-api/src/Presentation/appsettings.Development.json`
   - Updated PostgreSQL connection string to match migrations database

2. `services/onboarding-api/src/Migrations/appsettings.json`
   - Updated PostgreSQL connection string to use `kyb_case` database

## Frontend Status

✅ Frontend is correctly configured:
- User headers are being set correctly
- API routes are aligned
- Proxy is forwarding requests correctly
- Error handling is in place

The 500 errors will be resolved once the backend API is restarted with the correct database connection.

