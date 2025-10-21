# OAuth 2.1 Scopes & Roles Specification

## Overview

The platform uses OAuth 2.1 with Keycloak for authentication and authorization. This document defines the realm configuration, client scopes, roles, and integration points for internal Active Directory SSO.

## Keycloak Realm: `partners`

### Realm Settings
- **Name**: `partners`
- **Display Name**: Corporate Onboarding & KYC Platform
- **Enabled**: Yes
- **User Registration**: Disabled (invite-only)
- **Email as Username**: Yes
- **Login with Email**: Yes
- **Require SSL**: External requests

### Token Settings
- **Access Token Lifespan**: 15 minutes
- **Refresh Token Lifespan**: 30 days
- **SSO Session Idle**: 30 minutes
- **SSO Session Max**: 10 hours

## Clients

### 1. `onboarding-api` (Backend Service)

```json
{
  "clientId": "onboarding-api",
  "name": "Onboarding API Service",
  "description": "Corporate onboarding API backend",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "<generated-secret>",
  "serviceAccountsEnabled": true,
  "authorizationServicesEnabled": true,
  "standardFlowEnabled": false,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "publicClient": false,
  "protocol": "openid-connect",
  "attributes": {
    "access.token.lifespan": "900",
    "use.refresh.tokens": "true"
  }
}
```

### 2. `partner-portal` (Frontend SPA)

```json
{
  "clientId": "partner-portal",
  "name": "Partner Portal Web App",
  "enabled": true,
  "publicClient": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "redirectUris": [
    "https://portal.yourdomain.tld/*",
    "http://localhost:3000/*"
  ],
  "webOrigins": [
    "https://portal.yourdomain.tld",
    "http://localhost:3000"
  ],
  "protocol": "openid-connect"
}
```

### 3. `admin-portal` (Internal Admin)

```json
{
  "clientId": "admin-portal",
  "name": "Admin Portal (Internal)",
  "enabled": true,
  "publicClient": true,
  "standardFlowEnabled": true,
  "redirectUris": [
    "https://admin.yourdomain.tld/*",
    "http://localhost:3001/*"
  ],
  "webOrigins": [
    "https://admin.yourdomain.tld",
    "http://localhost:3001"
  ]
}
```

## Roles

### Realm Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `partner` | External partner user | View/edit own organization's cases |
| `partner_admin` | Partner administrator | Manage users within organization |
| `compliance_officer` | Internal compliance reviewer | Review, approve, reject cases |
| `risk_analyst` | Internal risk analyst | View risk assessments, flag cases |
| `admin` | Platform administrator | Full access to all resources |
| `auditor` | Read-only auditor | View all data, no modifications |

### Client Roles (onboarding-api)

| Role | Description |
|------|-------------|
| `case:read` | Read onboarding cases |
| `case:write` | Create/update onboarding cases |
| `case:delete` | Delete onboarding cases |
| `document:read` | Read documents |
| `document:write` | Upload documents |
| `webhook:configure` | Configure webhook endpoints |

## Scopes

### Standard OpenID Connect Scopes
- `openid` (required)
- `profile` (user profile info)
- `email` (email address)

### Custom Scopes

| Scope | Claims Included | Usage |
|-------|-----------------|-------|
| `onboarding` | `partner_id`, `organization_name` | Access onboarding API |
| `documents` | `partner_id` | Access document service |
| `admin` | `admin_permissions` | Admin portal access |
| `webhook` | `webhook_endpoints` | Webhook management |

### Scope-to-Role Mapping

```javascript
// Example token with claims
{
  "sub": "user-uuid",
  "email": "john@partner.com",
  "name": "John Doe",
  "realm_access": {
    "roles": ["partner", "case:read", "case:write"]
  },
  "resource_access": {
    "onboarding-api": {
      "roles": ["case:read", "case:write"]
    }
  },
  "partner_id": "uuid",
  "organization_name": "ACME Corp",
  "scope": "openid profile email onboarding"
}
```

## Authorization Matrix

### Onboarding Cases

| Action | Partner | Compliance Officer | Admin |
|--------|---------|-------------------|-------|
| Create case | ✅ (own org) | ❌ | ✅ |
| View case | ✅ (own org) | ✅ | ✅ |
| Update case | ✅ (own org, status=draft) | ❌ | ✅ |
| Submit case | ✅ (own org) | ❌ | ✅ |
| Approve/Reject case | ❌ | ✅ | ✅ |
| Delete case | ❌ | ❌ | ✅ |

### Documents

| Action | Partner | Compliance Officer | Admin |
|--------|---------|-------------------|-------|
| Upload document | ✅ (own cases) | ❌ | ✅ |
| View document | ✅ (own cases) | ✅ | ✅ |
| Delete document | ✅ (own cases, not submitted) | ❌ | ✅ |

### Webhooks

| Action | Partner Admin | Admin |
|--------|---------------|-------|
| Configure webhook URL | ✅ | ✅ |
| View webhook logs | ✅ (own org) | ✅ |
| Test webhook | ✅ | ✅ |
| Rotate signing secret | ✅ | ✅ |

## Active Directory Integration

### SAML 2.0 Federation

For internal users (compliance officers, admins), integrate with on-premise Active Directory via SAML.

#### Keycloak Identity Provider Configuration

```json
{
  "alias": "corporate-ad",
  "providerId": "saml",
  "displayName": "Corporate AD (SAML)",
  "enabled": true,
  "config": {
    "singleSignOnServiceUrl": "https://adfs.yourcompany.com/adfs/ls/",
    "singleLogoutServiceUrl": "https://adfs.yourcompany.com/adfs/ls/",
    "nameIDPolicyFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    "principalType": "SUBJECT",
    "signatureAlgorithm": "RSA_SHA256",
    "wantAuthnRequestsSigned": "true",
    "forceAuthn": "false",
    "validateSignature": "true",
    "signingCertificate": "<AD FS signing cert>"
  }
}
```

#### Attribute Mapping

| AD Attribute | Keycloak Claim | Description |
|--------------|----------------|-------------|
| `mail` | `email` | User email |
| `givenName` | `firstName` | First name |
| `sn` | `lastName` | Last name |
| `memberOf` | `groups` | AD groups |

#### Role Mapping (AD Groups → Keycloak Roles)

```javascript
// Map AD groups to Keycloak roles
{
  "Compliance-Team": "compliance_officer",
  "Risk-Analysis": "risk_analyst",
  "Platform-Admins": "admin",
  "Auditors": "auditor"
}
```

### OIDC Federation (Alternative)

If AD supports OIDC (Azure AD, Okta):

```json
{
  "alias": "azure-ad",
  "providerId": "oidc",
  "displayName": "Azure AD",
  "enabled": true,
  "config": {
    "authorizationUrl": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    "tokenUrl": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "logoutUrl": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout",
    "userInfoUrl": "https://graph.microsoft.com/oidc/userinfo",
    "clientId": "<azure-client-id>",
    "clientSecret": "<azure-client-secret>",
    "defaultScope": "openid profile email"
  }
}
```

## Token Validation (Backend Services)

### ASP.NET Core Example

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://keycloak.yourdomain.tld/realms/partners";
        options.Audience = "onboarding-api";
        options.RequireHttpsMetadata = true;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CaseRead", policy =>
        policy.RequireRole("partner", "compliance_officer", "admin"));
    
    options.AddPolicy("CaseApprove", policy =>
        policy.RequireRole("compliance_officer", "admin"));
    
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("admin"));
});

// Controller
[Authorize(Policy = "CaseRead")]
[HttpGet("{id}")]
public async Task<IActionResult> GetCase(Guid id)
{
    var partnerId = User.FindFirst("partner_id")?.Value;
    var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value);
    
    // Check ownership if partner role
    if (roles.Contains("partner") && case.PartnerId.ToString() != partnerId)
    {
        return Forbid();
    }
    
    return Ok(case);
}
```

## Password Policies

- **Minimum Length**: 12 characters
- **Complexity**: Must include uppercase, lowercase, number, special char
- **History**: Cannot reuse last 5 passwords
- **Max Age**: 90 days
- **Lockout**: 5 failed attempts → 30 min lockout

## MFA Requirements

- **Partners**: Optional (recommended)
- **Internal Staff**: Required (TOTP or WebAuthn)
- **Admins**: Required (WebAuthn preferred)

## Token Refresh Flow

```javascript
// Frontend refresh logic
async function getAccessToken() {
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('expires_at');
  
  if (Date.now() < expiresAt) {
    return accessToken;
  }
  
  // Refresh token
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('https://keycloak.yourdomain.tld/realms/partners/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'partner-portal',
      refresh_token: refreshToken
    })
  });
  
  const tokens = await response.json();
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  localStorage.setItem('expires_at', Date.now() + (tokens.expires_in * 1000));
  
  return tokens.access_token;
}
```

## Security Best Practices

1. **Never log tokens**: Redact in logs and error messages
2. **Use HTTPS only**: No plain HTTP in production
3. **Rotate secrets**: Client secrets every 90 days
4. **Validate audience**: Check `aud` claim matches your service
5. **Check token expiry**: Don't accept expired tokens
6. **Implement logout**: Clear tokens on logout
7. **Use short-lived tokens**: 15-minute access tokens
8. **Store refresh tokens securely**: HttpOnly cookies for web apps
9. **Monitor failed auth attempts**: Alert on suspicious patterns
10. **Regularly audit permissions**: Review user roles quarterly

