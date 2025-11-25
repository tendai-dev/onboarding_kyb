# Messaging API 500 Error - Root Cause & Fix

## Root Cause Identified ✅

The error logs show:
```
System.FormatException: Guid string should only contain hexadecimal characters.
at OnboardingApi.Presentation.Controllers.Messaging.MessagesController.GetCurrentUserId() in line 225
```

**The Problem:**
The `GetCurrentUserId()` method was trying to generate a GUID from an email hash using a flawed approach:
```csharp
// OLD CODE (BROKEN):
return Guid.Parse(email.GetHashCode().ToString().PadLeft(32, '0')...);
```

This fails because:
1. `GetHashCode()` returns an `int`, not a valid hex string
2. The string manipulation creates invalid GUID format
3. It was checking email BEFORE checking the `X-User-Id` header (which frontend sends)

## Fix Applied ✅

1. **Fixed `GetCurrentUserId()` method** - Now:
   - ✅ Checks `X-User-Id` header FIRST (frontend sends this)
   - ✅ Falls back to proper MD5-based GUID generation if header missing
   - ✅ Uses RFC 4122 compliant GUID generation

2. **Enhanced error handling** - Development mode now shows actual exception details

3. **Code compiles successfully** ✅

## What Needs to Happen

**The Docker container is still running OLD code.** You need to rebuild it:

```bash
cd "/Users/mukurusystemsadministrator/Desktop/onboarding_kyc copy"
docker-compose build onboarding-api
docker-compose up -d onboarding-api
```

Or restart the entire stack:
```bash
docker-compose restart onboarding-api
```

## Expected Result After Rebuild

- ✅ `GET /api/v1/messages/threads/my` - Returns `{"items":[],"totalCount":0,"page":1,"pageSize":20}`
- ✅ `GET /api/v1/messages/unread/count` - Returns `{"count":0}`
- ✅ No more 500 errors
- ✅ User ID correctly extracted from `X-User-Id` header

## SignalR 404 (Non-Critical)

The SignalR 404 errors are **expected** - the SignalR hub is not configured in the backend. Messaging works without real-time updates. This is handled gracefully by the frontend.

## Files Changed

1. `services/onboarding-api/src/Presentation/Controllers/Messaging/MessagesController.cs`
   - Fixed `GetCurrentUserId()` to check header first and use proper GUID generation

2. `services/onboarding-api/src/Presentation/Filters/GlobalExceptionFilter.cs`
   - Enhanced to show exception details in development mode

