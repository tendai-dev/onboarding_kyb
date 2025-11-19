# Fix OAuthSignin Error - Quick Guide

## The Problem
The `OAuthSignin` error means Keycloak doesn't recognize the redirect URI that NextAuth is trying to use.

## The Solution (2 minutes)

### Step 1: Open Keycloak Admin Console
1. Go to: **http://localhost:8080/admin**
2. Login with your admin credentials (usually `admin`/`admin` for local dev)

### Step 2: Navigate to Client Settings
1. Select realm: **mukuru** (from top-left dropdown)
2. Click **Clients** in left sidebar
3. Find and click on: **kyb-connect-portal**

### Step 3: Add Redirect URI
1. Click the **Settings** tab
2. Scroll to **Valid Redirect URIs**
3. Click **Add valid redirect URI**
4. Paste this EXACT URI (copy it exactly):
   ```
   http://localhost:3000/api/auth/callback/keycloak
   ```
5. Click **Add**

### Step 4: Add Web Origin
1. Scroll to **Web Origins**
2. Click **Add web origin**
3. Paste this:
   ```
   http://localhost:3000
   ```
4. Click **Add**

### Step 5: Save
1. Scroll to bottom
2. Click **Save**

### Step 6: Restart Next.js
1. Stop your Next.js server (Ctrl+C)
2. Start it again: `npm run dev`

### Step 7: Test
1. Go to: http://localhost:3000/auth/login
2. It should now work! 🎉

---

## Alternative: Use the Auto-Fix Script

If Keycloak is running and you have admin access:

```bash
cd partner
node scripts/fix-keycloak-redirect-uri.js
```

**Note:** You may need to set these environment variables if your Keycloak admin credentials are different:
```bash
export KEYCLOAK_ADMIN_USER=your-admin-username
export KEYCLOAK_ADMIN_PASSWORD=your-admin-password
```

---

## Still Not Working?

1. **Check Keycloak is running:**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Verify the redirect URI is exactly:**
   ```
   http://localhost:3000/api/auth/callback/keycloak
   ```
   (No trailing slash, exact case, exact path)

3. **Check your .env file has:**
   ```env
   NEXTAUTH_URL=http://localhost:3000
   KEYCLOAK_ISSUER=http://localhost:8080/realms/mukuru
   KEYCLOAK_CLIENT_ID=kyb-connect-portal
   ```

4. **Check server logs** when you try to login - you should see:
   ```
   [NextAuth Config] Keycloak Configuration: {
     expectedRedirectUri: 'http://localhost:3000/api/auth/callback/keycloak',
     ...
   }
   ```

