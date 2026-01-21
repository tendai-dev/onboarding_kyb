# Authentication Configuration Verification

## ✅ Production-Ready Configuration Checklist

### 1. Environment Variables (CRITICAL)
Ensure these are set in production:

```bash
# REQUIRED - Must be set
NEXTAUTH_URL=https://partner-mukuru.kurasika.tech
NEXTAUTH_SECRET=<generated-secret>  # Generate with: openssl rand -base64 32

# REQUIRED - Keycloak Configuration
KEYCLOAK_CLIENT_ID=kyb-connect-portal
KEYCLOAK_ISSUER=https://keycloak-staging.app-stg.mukuru.io/realms/mukuru
KEYCLOAK_WELL_KNOWN=https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/.well-known/openid-configuration

# OPTIONAL - Only if using confidential client
KEYCLOAK_CLIENT_SECRET=  # Leave empty for public client (uses PKCE)

# REQUIRED - Redis Configuration
REDIS_URL=redis://redis:6379  # Or your Redis connection string
```

### 2. Keycloak Client Configuration
Verify in Keycloak Admin Console:
- **Client ID**: `kyb-connect-portal`
- **Access Type**: Public (if no client secret) OR Confidential (if using secret)
- **Valid Redirect URIs** (MUST include both):
  - `https://partner-mukuru.kurasika.tech/api/auth/callback/keycloak` ✅ PRIMARY
  - `https://partner-mukuru.kurasika.tech/auth/callback` ✅ FALLBACK
- **Web Origins**: `https://partner-mukuru.kurasika.tech`
- **PKCE Code Challenge Method**: S256 (for public clients)

### 3. Authentication Flow Verification

#### Flow Steps:
1. ✅ User visits `/auth/login`
2. ✅ NextAuth redirects to Keycloak with `redirect_uri=/api/auth/callback/keycloak`
3. ✅ Keycloak authenticates user
4. ✅ Keycloak redirects to `/api/auth/callback/keycloak` with authorization code
5. ✅ NextAuth exchanges code for tokens
6. ✅ NextAuth creates session in Redis
7. ✅ NextAuth redirects to `/partner/dashboard`

#### Callback Routes:
- **Primary**: `/api/auth/callback/keycloak` - NextAuth default handler
- **Fallback**: `/auth/callback` - Redirects to primary handler

### 4. Redis Connection
- ✅ Redis adapter handles connection errors gracefully
- ✅ Falls back if Redis is temporarily unavailable
- ✅ Logs connection status on startup

### 5. Error Handling
- ✅ OAuth errors are caught and displayed to user
- ✅ Redis errors don't block authentication
- ✅ Detailed logging for debugging
- ✅ Redirect callback ensures proper post-auth redirect

### 6. Security Features
- ✅ HTTP-only session cookies
- ✅ Secure cookies in production
- ✅ SameSite=strict for CSRF protection
- ✅ Tokens stored in Redis (not in cookies)
- ✅ BFF (Backend-For-Frontend) pattern

## 🔍 Debugging Endpoints

### Check Configuration
```bash
GET /api/auth/debug
```
Returns current configuration status (without exposing secrets)

### Test Token Exchange
```bash
GET /api/auth/test-token-exchange?code=<authorization-code>
```
Tests Keycloak token exchange manually

## 🚨 Common Issues & Solutions

### Issue: "Callback" error
**Cause**: Redirect URI mismatch or token exchange failure
**Solution**: 
1. Verify both redirect URIs are in Keycloak
2. Check `NEXTAUTH_URL` matches production URL
3. Check server logs for detailed error

### Issue: "Loading..." on callback
**Cause**: Redis connection failure or handler hanging
**Solution**:
1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_URL` is correct
3. Check server logs for Redis errors

### Issue: Authentication loop
**Cause**: Redirect callback not working
**Solution**: 
1. Verify redirect callback returns dashboard URL
2. Check `NEXTAUTH_URL` is set correctly
3. Ensure cookies are being set (check browser dev tools)

## 📋 Production Deployment Checklist

- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `REDIS_URL` points to production Redis
- [ ] Keycloak client has both redirect URIs registered
- [ ] Keycloak client access type matches (public/confidential)
- [ ] Redis is accessible from application
- [ ] HTTPS is enabled (required for secure cookies)
- [ ] Server logs are monitored for authentication errors

## 🔐 Security Notes

1. **Never expose** `NEXTAUTH_SECRET` in client-side code
2. **Never expose** `KEYCLOAK_CLIENT_SECRET` (if using confidential client)
3. **Always use HTTPS** in production
4. **Monitor** Redis connection for security issues
5. **Rotate** `NEXTAUTH_SECRET` periodically

## 📊 Monitoring

Watch for these log patterns:
- `[NextAuth Config]` - Configuration on startup
- `[NextAuth Handler]` - Request handling
- `[NextAuth] Redirect callback` - Post-auth redirects
- `[RedisAdapter]` - Redis operations
- `[NextAuth Error]` - Authentication errors

