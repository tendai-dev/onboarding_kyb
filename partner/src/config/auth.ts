/**
 * Get the redirect URI dynamically based on the current origin
 */
function getRedirectUri(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/auth/callback';
  }
  
  // Use environment variable if set, otherwise construct from current origin
  const envRedirect = process.env.NEXT_PUBLIC_REDIRECT_URI;
  if (envRedirect) {
    return envRedirect;
  }
  
  // Construct from current origin
  return `${window.location.origin}/auth/callback`;
}

export const authConfig = {
  clientId: 'kyb-connect-portal',
  authUrl: 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/protocol/openid-connect/auth',
  tokenUrl: 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/protocol/openid-connect/token',
  wellKnown: 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru/.well-known/openid-configuration',
  get redirectUri() {
    return getRedirectUri();
  }
};

export const REQUIRED_RESOURCE = 'resource:kyb-connect';
export const REQUIRED_ROLE = 'business-user';
export const ENFORCE_ROLE = false; // temporary bypass


