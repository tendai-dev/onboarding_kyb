# Quick Fix Summary - OAuthSignin Error

## Current Status
✅ Local configuration updated to point to remote Keycloak  
❌ Redirect URI not yet added in remote Keycloak (this is why error persists)

## The Fix (Choose One)

### Option A: You Have Keycloak Admin Access
1. **Open:** https://keycloak-staging.app-stg.mukuru.io/admin
2. **Login** with admin credentials
3. **Navigate:** 
   - Realm: `mukuru` (top-left dropdown)
   - Clients → `kyb-connect-portal` → Settings tab
4. **Add Redirect URI:**
   - Scroll to "Valid Redirect URIs"
   - Click "Add valid redirect URI"
   - Paste: `http://localhost:3000/api/auth/callback/keycloak`
   - Click "Add"
5. **Add Web Origin:**
   - Scroll to "Web Origins"  
   - Click "Add web origin"
   - Paste: `http://localhost:3000`
   - Click "Add"
6. **Save** (bottom of page)
7. **Restart** Next.js server

### Option B: Ask DevOps/Team Lead
Send them this message:

```
Hi! I need a redirect URI added to Keycloak for local development:

Realm: mukuru
Client: kyb-connect-portal
Redirect URI: http://localhost:3000/api/auth/callback/keycloak
Web Origin: http://localhost:3000

This is needed to fix the OAuthSignin error in the partner portal.
Thanks!
```

## Verify Configuration

After the redirect URI is added, verify:

1. **Check your .env.local has:**
   ```env
   KEYCLOAK_ISSUER=https://keycloak-staging.app-stg.mukuru.io/realms/mukuru
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Restart Next.js:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Test login:**
   - Go to: http://localhost:3000/auth/login
   - Should redirect to Keycloak login (not show OAuthSignin error)

## Still Not Working?

Check server console logs when you try to login - you should see:
```
[NextAuth Config] Keycloak Configuration: {
  expectedRedirectUri: 'http://localhost:3000/api/auth/callback/keycloak',
  ...
}
```

If the redirect URI in logs doesn't match what's in Keycloak, that's the problem!

