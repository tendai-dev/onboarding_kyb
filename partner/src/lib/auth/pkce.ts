export function generateRandomString(length: number = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export type OidcConfig = {
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope?: string;
};

const CODE_VERIFIER_KEY = 'oidc_code_verifier';
const OIDC_STATE_KEY = 'oidc_state';

export async function startAuthorization(config: OidcConfig, options?: { register?: boolean }) {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    throw new Error('Authorization can only be started in a browser environment');
  }

  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await sha256(codeVerifier);

  // Store PKCE state securely in sessionStorage
  try {
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(OIDC_STATE_KEY, state);
  } catch (error) {
    console.error('Failed to store PKCE state:', error);
    throw new Error('Failed to initialize authentication. Please ensure cookies and local storage are enabled.');
  }

  // Get redirect URI (getters are accessed automatically)
  const redirectUri = config.redirectUri;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scope ?? 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  });

  // Keycloak-specific registration hint
  if (options?.register) {
    params.append('kc_action', 'register');
  }

  const url = `${config.authUrl}?${params.toString()}`;
  
  // Use replace to avoid adding to history
  try {
    window.location.replace(url);
  } catch (error) {
    // Fallback to href if replace fails
    window.location.href = url;
  }
}

export function getCodeVerifierAndState(): { codeVerifier: string | null; state: string | null } {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  const state = sessionStorage.getItem(OIDC_STATE_KEY);
  return { codeVerifier, state };
}

export function clearPkceState() {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(OIDC_STATE_KEY);
}


