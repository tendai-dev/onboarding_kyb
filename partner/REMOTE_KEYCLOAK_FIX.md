# Fix OAuthSignin Error - Remote Mukuru Keycloak

## The Problem
The `OAuthSignin` error means the remote Mukuru Keycloak instance doesn't have the redirect URI registered for the `kyb-connect-portal` client.

## The Solution

Since Keycloak is remote (https://keycloak-staging.app-stg.mukuru.io), you need to:

### Step 1: Update Your .env File

Make sure your `.env` or `.env.local` file points to the remote Keycloak:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
KEYCLOAK_ISSUER=https://keycloak-staging.app-stg.mukuru.io/realms/mukuru
KEYCLOAK_CLIENT_ID=kyb-connect-portal
KEYCLOAK_CLIENT_SECRET=your-keycloak-client-secret
KEYCLOAK_WELL_KNOWN=https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/.well-known/openid-configuration
```

### Step 2: Access Remote Keycloak Admin Console

1. **Get access to the remote Keycloak Admin Console:**
   - URL: `https://keycloak-staging.app-stg.mukuru.io/admin`
   - You'll need admin credentials (contact your team lead or DevOps)

2. **Navigate to the client:**
   - Select realm: **mukuru** (from top-left dropdown)
   - Click **Clients** in left sidebar
   - Find and click: **kyb-connect-portal**

3. **Add Redirect URI:**
   - Click the **Settings** tab
   - Scroll to **Valid Redirect URIs**
   - Click **Add valid redirect URI**
   - Add this EXACT URI:
     ```
     http://localhost:3000/api/auth/callback/keycloak
     ```
   - **Note:** If you're deploying to a different URL (staging/production), also add:
     ```
     https://your-staging-url.com/api/auth/callback/keycloak
     https://your-production-url.com/api/auth/callback/keycloak
     ```

4. **Add Web Origin:**
   - Scroll to **Web Origins**
   - Click **Add web origin**
   - Add:
     ```
     http://localhost:3000
     ```
   - **Note:** Also add staging/production URLs if needed

5. **Save:**
   - Scroll to bottom
   - Click **Save**

### Step 3: Restart Next.js Server

```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test

Go to: http://localhost:3000/auth/login

---

## Alternative: Ask DevOps/Team Lead

If you don't have access to the Keycloak Admin Console, ask your team lead or DevOps to:

1. Add redirect URI: `http://localhost:3000/api/auth/callback/keycloak`
2. Add web origin: `http://localhost:3000`
3. For the client: `kyb-connect-portal` in realm: `mukuru`

---

## For Production/Staging Deployments

When deploying, make sure to add the production/staging redirect URIs:

- **Staging:** `https://your-staging-url.com/api/auth/callback/keycloak`
- **Production:** `https://your-production-url.com/api/auth/callback/keycloak`

And update `NEXTAUTH_URL` in your environment variables accordingly.

