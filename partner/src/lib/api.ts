/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type UserCase = {
  id?: string; // Application GUID (from projections API)
  caseId: string;
  type: string;
  status: string;
  partnerId?: string;
  applicantFirstName?: string;
  applicantLastName?: string;
  applicantEmail?: string;
  country?: string; // Maps from applicantCountry in backend
  progressPercentage?: number;
  riskLevel?: string;
  riskScore?: number;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  metadataJson?: string; // Dynamic fields from Entity Configuration Service
  businessLegalName?: string;
  businessCountryOfRegistration?: string;
};

export type DashboardSummary = {
  generatedAt: string;
  cases: {
    totalCases: number;
    activeCases: number;
    completedCases: number;
    rejectedCases: number;
    pendingReviewCases: number;
    overdueCases: number;
  };
  performance: {
    completionRate: number;
    approvalRate: number;
    rejectionRate: number;
  };
  risk: {
    highRiskCases: number;
    mediumRiskCases: number;
    lowRiskCases: number;
    averageRiskScore: number;
  };
};

// Route via Next.js proxy to avoid CORS
// Proxy will automatically inject tokens from Redis based on session cookie
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api/proxy';
const MESSAGING_PREFIX = '/api/v1'; // Messaging is part of unified onboarding-api

// Tokens are no longer accessed from localStorage - proxy handles authentication

/**
 * Generate a consistent UUID v5 from email address (matches backend implementation)
 * This is used to generate PartnerId and UserId from Keycloak email addresses
 *
 * @param email - User's email address from Keycloak
 * @returns UUID v5 string (deterministic, same email always produces same UUID)
 */
/**
 * Get PartnerId from backend (SINGLE SOURCE OF TRUTH)
 *
 * IMPORTANT: Backend is the single source of truth for PartnerId generation.
 * Frontend should NOT generate MD5 hashes - always get PartnerId from backend.
 *
 * @param email - Authenticated user's email address
 * @returns PartnerId as GUID string, or null if not available
 */
export async function getPartnerIdFromBackend(email: string): Promise<string | null> {
  if (!email || !email.trim()) {
    return null;
  }

  try {
    // PRIMARY: Get PartnerId from backend endpoint (single source of truth)
    const response = await apiGet<{
      email: string;
      partnerId: string;
      partnerIdGuid: string;
    }>('/api/v1/partner/id');

    if (response && response.partnerId) {
      console.info(
        `✅ Got PartnerId from backend (single source of truth): ${response.partnerId} for email: ${email}`
      );
      return response.partnerId;
    }
  } catch (error) {
    console.warn('⚠️ Could not get PartnerId from backend endpoint:', error);
  }

  return null;
}

/**
 * @deprecated Use getPartnerIdFromBackend() instead - backend is single source of truth
 * This function is kept for backward compatibility only
 */
export async function generatePartnerIdFromEmail(email: string): Promise<string> {
  console.warn(
    '⚠️ generatePartnerIdFromEmail() is deprecated. Use getPartnerIdFromBackend() instead.'
  );
  const partnerId = await getPartnerIdFromBackend(email);
  if (partnerId) {
    return partnerId;
  }
  // Fallback: Use simple hash (won't match backend exactly)
  return generateUserIdFromEmail(email);
}

/**
 * Generate UserId from email using MD5 hash (matches backend implementation)
 * This creates a deterministic UUID from an email address using MD5.
 * The backend uses the same algorithm in MessagesController.GetCurrentUserId()
 */
export function generateUserIdFromEmail(email: string): string {
  if (!email) return '';
  
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  
  // Use MD5 hash (same as backend)
  // Since we can't use crypto.subtle.digest for MD5 (not supported), 
  // we use a simple MD5 implementation
  const md5Hash = md5(normalizedEmail);
  
  // Convert hex string to bytes and apply UUID version 5 bits (same as backend)
  const bytes = hexToBytes(md5Hash);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // Version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  
  // Format as UUID
  const hex = bytesToHex(bytes);
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// Simple MD5 implementation (matches .NET's MD5.Create().ComputeHash())
function md5(str: string): string {
  function rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  function addUnsigned(x: number, y: number): number {
    const x8 = x & 0x80000000;
    const y8 = y & 0x80000000;
    const x4 = x & 0x40000000;
    const y4 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x8 ^ y8;
      return result ^ 0x40000000 ^ x8 ^ y8;
    }
    return result ^ x8 ^ y8;
  }

  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const bytes = new TextEncoder().encode(str);
    const numWords = (((bytes.length + 8) >>> 6) + 1) * 16;
    const words: number[] = new Array(numWords).fill(0);
    
    for (let i = 0; i < bytes.length; i++) {
      words[i >>> 2] |= bytes[i] << ((i % 4) * 8);
    }
    words[bytes.length >>> 2] |= 0x80 << ((bytes.length % 4) * 8);
    words[numWords - 2] = bytes.length * 8;
    return words;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += byte.toString(16).padStart(2, '0');
    }
    return hex;
  }

  const x = convertToWordArray(str);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;

    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}


/**
 * Make an API request with automatic token refresh on 401
 */
async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    retry?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  // Tokens are no longer accessed from localStorage
  // The proxy will automatically inject the Authorization header from Redis based on session cookie

  // Generate or retrieve trace ID for request tracking
  const traceId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('traceId') || crypto.randomUUID()
      : crypto.randomUUID();

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('traceId', traceId);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Trace-Id': traceId,
    'X-Request-Id': traceId,
  };

  // DO NOT set Authorization header - proxy will inject it from Redis
  // All requests must include credentials to send session cookie
  // Try to get user info from NextAuth session for user identification headers
  // These headers are critical for backend to identify the user
  try {
    const sessionResponse = await fetch('/api/auth/session');
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      if (session?.user) {
        headers['X-User-Name'] =
          session.user.name || session.user.email || 'Partner User';
        headers['X-User-Role'] = 'Applicant';
        if (session.user.email) {
          headers['X-User-Email'] = session.user.email;
          // Generate a consistent GUID from email for user identification
          const userId = generateUserIdFromEmail(session.user.email);
          headers['X-User-Id'] = userId;
          console.info('[API] User headers set:', {
            email: session.user.email,
            userId,
            name: headers['X-User-Name'],
          });
        }
      }
    } else {
      console.warn(
        '[API] Failed to get session:',
        sessionResponse.status,
        sessionResponse.statusText
      );
    }
  } catch (error) {
    // Log error but continue - backend will handle missing headers
    console.warn('[API] Error fetching session for user headers:', error);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Make initial request
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, fetchOptions);
  } catch (networkError) {
    // Handle network errors (connection refused, DNS failures, etc.)
    const error = new Error(
      `Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`
    );
    (error as any).isNetworkError = true;
    throw error;
  }

  // Handle 401 Unauthorized - redirect to login
  // Token refresh is handled server-side by NextAuth
  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  // Retry logic for network/server errors (5xx), but not 503 (Service Unavailable)
  // 503 means the service isn't running, so retrying won't help
  if (!response.ok && response.status >= 500 && response.status !== 503) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        const retryResponse = await fetch(`${API_BASE}${path}`, fetchOptions);
        if (retryResponse.ok || retryResponse.status < 500) {
          response = retryResponse;
          break;
        }
        if (attempt === maxRetries) {
          response = retryResponse;
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');

    // 401 already handled above

    // For 503 (Service Unavailable) and 404 (Not Found), mark them for graceful handling
    const error = new Error(`${method} ${path} failed: ${response.status} ${text}`);
    if (response.status === 503) {
      // Mark it as a service unavailable error so callers can handle it gracefully
      (error as any).isServiceUnavailable = true;
    } else if (response.status === 404) {
      // Mark 404 errors so callers can handle them gracefully (e.g., user doesn't exist yet)
      (error as any).isNotFound = true;
    }
    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const jsonData = await response.json();

    // Transform snake_case to camelCase for PartnerId endpoint
    // Backend returns snake_case (partner_id) but frontend expects camelCase (partnerId)
    if (path.includes('/partner/id') && jsonData) {
      return {
        ...jsonData,
        partnerId: jsonData.partner_id || jsonData.partnerId,
        partnerIdGuid: jsonData.partner_id_guid || jsonData.partnerIdGuid,
      } as T;
    }

    return jsonData as T;
  }

  return {} as T;
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body });
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body });
}

async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}

export async function getDashboard(partnerId?: string): Promise<DashboardSummary> {
  const qs = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : '';
  // Backend route: /api/v1/projections/dashboard
  return apiGet<DashboardSummary>(`/api/v1/projections/dashboard${qs}`);
}

/**
 * Find user case by email
 *
 * OWNERSHIP MODEL:
 * - Cases are owned by PartnerId (generated from authenticated user's email via MD5)
 * - PartnerId is the PRIMARY ownership identifier (indexed in database)
 * - Applicant.Email may differ from authenticated user's email
 *
 * This function:
 * 1. First tries to generate PartnerId from email and query by PartnerId (fast, indexed)
 * 2. Falls back to email matching if PartnerId generation differs
 *
 * @param email - Authenticated user's email (used to generate PartnerId)
 * @returns UserCase if found, null otherwise
 */
export async function findUserCaseByEmail(email: string): Promise<UserCase | null> {
  if (!email) return null;

  // Get PartnerId from backend (single source of truth)
  // Backend generates PartnerId using MD5 - frontend should NOT generate it
  let userPartnerId: string | null = null;
  try {
    // PRIMARY: Get PartnerId from backend endpoint (single source of truth)
    const partnerIdResponse = await apiGet<{
      email: string;
      partnerId: string;
      partnerIdGuid: string;
    }>('/api/v1/partner/id');

    if (partnerIdResponse && partnerIdResponse.partnerId) {
      userPartnerId = partnerIdResponse.partnerId;
      console.info(
        `✅ Got PartnerId from backend (single source of truth): ${userPartnerId} for email: ${email}`
      );
    }
  } catch (error) {
    console.warn(
      '⚠️ Could not get PartnerId from backend endpoint, trying from case response...',
      error
    );

    // FALLBACK 1: Try to get PartnerId from a case response
    try {
      const caseResponse = await apiGet<{
        items: Array<{ partnerId?: string }>;
      }>(`/api/v1/cases?take=1&searchTerm=${encodeURIComponent(email)}`);

      if (caseResponse?.items?.[0]?.partnerId) {
        userPartnerId = caseResponse.items[0].partnerId;
        console.info(`✅ Got PartnerId from case response: ${userPartnerId}`);
      }
    } catch (caseError) {
      console.warn(
        '⚠️ Could not get PartnerId from case response, using local generation (may not match):',
        caseError
      );

      // FALLBACK 2: This should rarely happen - backend should always provide PartnerId
      // If we get here, it means both backend endpoint and case API are unavailable
      console.error(
        '❌ Cannot get PartnerId from backend - both endpoint and case API failed'
      );
      console.error(
        '💡 This should not happen in normal operation. Backend should always provide PartnerId.'
      );
      userPartnerId = null;
    }
  }
  // PRIMARY: Try direct Cases API first (most reliable - always up to date)
  // Projections might not be synced, so we query the source of truth first
  try {
    let caseApiUrl: string;
    if (userPartnerId) {
      const cleanPartnerId = userPartnerId.trim();
      caseApiUrl = `/api/v1/cases?partnerId=${encodeURIComponent(cleanPartnerId)}&take=10&sortBy=createdAt&sortDirection=desc`;
      console.info(`🔍 [PRIMARY] Querying Cases API by PartnerId: ${cleanPartnerId}`);
    } else {
      caseApiUrl = `/api/v1/cases?searchTerm=${encodeURIComponent(email)}&take=10&sortBy=createdAt&sortDirection=desc`;
      console.info(`🔍 [PRIMARY] Querying Cases API by email: ${email}`);
    }

    const caseApiResult = await apiGet<{
      items: Array<{
        caseId: string;
        caseNumber: string;
        type: string;
        status: string;
        partnerId: string;
        applicantFirstName?: string;
        applicantLastName?: string;
        applicantEmail?: string;
        applicantCountry?: string;
        businessLegalName?: string;
        createdAt: string;
        updatedAt: string;
      }>;
      totalCount: number;
    }>(caseApiUrl);

    console.info(`✅ [Cases API] Found ${caseApiResult?.items?.length || 0} cases`);

    if (caseApiResult?.items && caseApiResult.items.length > 0) {
      // Match by PartnerId first (most reliable)
      let matchingCase;
      if (userPartnerId) {
        const normalizedUserPartnerId = userPartnerId.toLowerCase().trim();
        matchingCase = caseApiResult.items.find((c) => {
          if (!c.partnerId) return false;
          return c.partnerId.toLowerCase().trim() === normalizedUserPartnerId;
        });
      }

      // Fallback to email match if PartnerId didn't match
      if (!matchingCase) {
        const normalizedSearchEmail = email.toLowerCase().trim();
        matchingCase = caseApiResult.items.find((c) => {
          if (!c.applicantEmail) return false;
          return c.applicantEmail.toLowerCase().trim() === normalizedSearchEmail;
        });
      }

      if (matchingCase) {
        // In Cases API, caseId IS the application GUID (Id.ToString())
        // caseNumber is the human-readable case number
        const applicationGuid = matchingCase.caseId; // This is the GUID
        const caseNumber = matchingCase.caseNumber || matchingCase.caseId; // Human-readable case number
        console.info(
          `✅ Found case in Cases API: GUID=${applicationGuid}, caseNumber=${caseNumber}`
        );
        return {
          id: applicationGuid, // Application GUID
          caseId: caseNumber, // Human-readable case number for display
          type: matchingCase.type,
          status: matchingCase.status,
          partnerId: matchingCase.partnerId,
          applicantFirstName: matchingCase.applicantFirstName,
          applicantLastName: matchingCase.applicantLastName,
          applicantEmail: matchingCase.applicantEmail,
          country: matchingCase.applicantCountry,
          businessLegalName: matchingCase.businessLegalName,
          createdAt: matchingCase.createdAt,
          updatedAt: matchingCase.updatedAt,
        };
      }
    }
  } catch (caseApiError) {
    console.warn('⚠️ Cases API query failed, trying projections API:', caseApiError);
  }

  // FALLBACK: Try Projections API (might have more complete data if synced)
  try {
    const params = new URLSearchParams({ take: '10' });
    if (userPartnerId) {
      params.append('partnerId', userPartnerId);
      console.info(
        `🔍 [FALLBACK] Querying Projections API by PartnerId: ${userPartnerId}`
      );
    } else {
      params.append('searchTerm', email);
      console.warn('⚠️ PartnerId not available, using email search (less reliable)');
    }

    const result = await apiGet<{
      items: Array<{
        id?: string; // Application GUID
        Id?: string; // Application GUID (C# naming)
        caseId: string;
        type: string;
        status: string;
        partnerId?: string;
        applicantFirstName?: string;
        applicantLastName?: string;
        applicantEmail?: string;
        applicantCountry?: string;
        country?: string;
        progressPercentage?: number;
        riskLevel?: string;
        riskScore?: number;
        createdAt?: string;
        updatedAt?: string;
        assignedTo?: string;
        assignedToName?: string;
        assignedAt?: string;
        metadataJson?: string;
        businessLegalName?: string;
        businessCountryOfRegistration?: string;
      }>;
    }>(`/api/v1/projections/cases?${params.toString()}`);

    // PRIMARY: If we have PartnerId from backend, filter by PartnerId (ownership)
    // PartnerId is the ownership identifier - if it matches, the case belongs to the user
    let matchingItem;
    if (userPartnerId) {
      // Filter by PartnerId first (ownership check) - case-insensitive comparison
      const normalizedUserPartnerId = userPartnerId.toLowerCase().trim();
      matchingItem = result.items?.find((item) => {
        if (!item.partnerId) {
          console.warn(`⚠️ Case ${item.caseId} has no partnerId`);
          return false;
        }
        const normalizedItemPartnerId = item.partnerId.toLowerCase().trim();
        const partnerMatch = normalizedItemPartnerId === normalizedUserPartnerId;
        if (partnerMatch) {
          console.info(
            `✅ Found case by PartnerId match: ${item.caseId} (partnerId: ${item.partnerId}, expected: ${userPartnerId})`
          );
        }
        return partnerMatch;
      });

      if (!matchingItem && result.items && result.items.length > 0) {
        console.warn(
          `⚠️ No PartnerId match in projections. Expected: "${userPartnerId}", Found in results:`,
          result.items.map((i) => ({ caseId: i.caseId, partnerId: i.partnerId }))
        );
      }
    }

    // FALLBACK: If no PartnerId match, filter by email (less reliable)
    if (!matchingItem) {
      const normalizedSearchEmail = email.toLowerCase().trim();
      matchingItem = result.items?.find((item) => {
        if (!item.applicantEmail) {
          return false;
        }

        // Normalize case email for comparison
        const normalizedCaseEmail = item.applicantEmail.toLowerCase().trim();
        const emailMatch = normalizedCaseEmail === normalizedSearchEmail;

        // Also check PartnerId if available (should match)
        const partnerMatch =
          !userPartnerId ||
          !item.partnerId ||
          item.partnerId.toLowerCase().trim() === userPartnerId.toLowerCase().trim();
        return emailMatch && partnerMatch;
      });
    }

    if (matchingItem) {
      // Map applicantCountry to country if needed
      // Get application GUID (handle both Id and id from API)
      const applicationId = matchingItem.id || matchingItem.Id;
      return {
        id: applicationId, // Application GUID
        caseId: matchingItem.caseId,
        type: matchingItem.type,
        status: matchingItem.status,
        partnerId: matchingItem.partnerId,
        applicantFirstName: matchingItem.applicantFirstName,
        applicantLastName: matchingItem.applicantLastName,
        applicantEmail: matchingItem.applicantEmail,
        country: matchingItem.country || matchingItem.applicantCountry || undefined,
        metadataJson: matchingItem.metadataJson,
        businessLegalName: matchingItem.businessLegalName,
        businessCountryOfRegistration: matchingItem.businessCountryOfRegistration,
        progressPercentage: matchingItem.progressPercentage,
        riskLevel: matchingItem.riskLevel,
        riskScore: matchingItem.riskScore,
        createdAt: matchingItem.createdAt,
        updatedAt: matchingItem.updatedAt,
        assignedTo: matchingItem.assignedTo,
        assignedToName: matchingItem.assignedToName,
        assignedAt: matchingItem.assignedAt,
      };
    }

    // Fallback: If not found in projections, try case API directly (for newly created cases)
    // This handles cases that haven't been synced to projections yet
    console.info('Case not found in projections API, trying case API directly...');
    console.info('Using PartnerId for ownership query:', userPartnerId);
    try {
      // PRIMARY METHOD: Query by PartnerId (ownership identifier)
      // This is indexed in the database and is the correct way to find user's cases
      let fallbackUrl: string;
      if (userPartnerId) {
        // Ensure PartnerId is in correct GUID format (remove any dashes issues)
        const cleanPartnerId = userPartnerId.trim();
        fallbackUrl = `/api/v1/cases?partnerId=${encodeURIComponent(cleanPartnerId)}&take=100&sortBy=createdAt&sortDirection=desc`;
        console.info('🔍 Querying cases by PartnerId (ownership):', fallbackUrl);
        console.info('🔍 PartnerId being used:', cleanPartnerId);
      } else {
        // Fallback: If PartnerId not available, fetch recent cases and filter by email
        fallbackUrl = `/api/v1/cases?take=100&sortBy=createdAt&sortDirection=desc`;
        console.warn(
          '⚠️ PartnerId not available, fetching all recent cases (less efficient)'
        );
      }
      const caseApiResult = await apiGet<{
        items: Array<{
          caseId: string;
          caseNumber: string;
          type: string;
          status: string;
          partnerId: string;
          applicantFirstName?: string;
          applicantLastName?: string;
          applicantEmail?: string;
          applicantCountry?: string;
          businessLegalName?: string;
          createdAt: string;
          updatedAt: string;
        }>;
        totalCount: number;
      }>(fallbackUrl);

      console.info(`Found ${caseApiResult?.items?.length || 0} cases from API`);

      // If PartnerId query returned 0 results, try querying all recent cases and filter by email
      // This handles cases where PartnerId might not match exactly
      if (caseApiResult?.items?.length === 0 && userPartnerId) {
        console.info(
          '⚠️ PartnerId query returned 0 results, trying broader search by email...'
        );
        try {
          const allCasesResult = await apiGet<{
            items: Array<{
              caseId: string;
              caseNumber: string;
              type: string;
              status: string;
              partnerId: string;
              applicantFirstName?: string;
              applicantLastName?: string;
              applicantEmail?: string;
              applicantCountry?: string;
              businessLegalName?: string;
              createdAt: string;
              updatedAt: string;
            }>;
            totalCount: number;
          }>(`/api/v1/cases?take=100&sortBy=createdAt&sortDirection=desc`);

          console.info(
            `Found ${allCasesResult?.items?.length || 0} total cases in database`
          );

          if (allCasesResult?.items && allCasesResult.items.length > 0) {
            // Log all cases for debugging
            console.info(
              '📋 All cases found:',
              allCasesResult.items.map((c) => ({
                caseNumber: c.caseNumber || c.caseId,
                applicantEmail: c.applicantEmail || '(missing)',
                partnerId: c.partnerId,
                status: c.status,
              }))
            );

            // PRIMARY: Try to match by PartnerId first (most reliable)
            // This works even if applicantEmail is missing
            if (userPartnerId) {
              const partnerIdMatch = allCasesResult.items.find((c) => {
                if (!c.partnerId) return false;
                const matches = c.partnerId.toLowerCase() === userPartnerId.toLowerCase();
                if (matches) {
                  console.info(
                    `✅ PartnerId match found: "${c.partnerId}" === "${userPartnerId}"`
                  );
                }
                return matches;
              });

              if (partnerIdMatch) {
                // In Cases API, caseId IS the application GUID (Id.ToString())
                const applicationGuid = partnerIdMatch.caseId; // This is the GUID
                const caseNumber = partnerIdMatch.caseNumber || partnerIdMatch.caseId; // Human-readable case number
                console.info(
                  `✅ Found case by PartnerId match: GUID=${applicationGuid}, caseNumber=${caseNumber} (partnerId: ${partnerIdMatch.partnerId})`
                );
                return {
                  id: applicationGuid, // Application GUID
                  caseId: caseNumber, // Human-readable case number for display
                  type: partnerIdMatch.type,
                  status: partnerIdMatch.status,
                  partnerId: partnerIdMatch.partnerId,
                  applicantFirstName: partnerIdMatch.applicantFirstName,
                  applicantLastName: partnerIdMatch.applicantLastName,
                  applicantEmail: partnerIdMatch.applicantEmail,
                  country: partnerIdMatch.applicantCountry,
                  businessLegalName: partnerIdMatch.businessLegalName,
                  createdAt: partnerIdMatch.createdAt,
                  updatedAt: partnerIdMatch.updatedAt,
                };
              } else {
                console.warn(
                  `⚠️ No PartnerId match. Expected: "${userPartnerId}", Found in cases:`,
                  allCasesResult.items.map((c) => c.partnerId)
                );
              }
            }

            // FALLBACK: Filter by email (only if PartnerId didn't match)
            const normalizedSearchEmail = email.toLowerCase().trim();
            const emailMatch = allCasesResult.items.find((c) => {
              if (!c.applicantEmail) {
                return false;
              }
              const caseEmail = c.applicantEmail.toLowerCase().trim();
              const matches = caseEmail === normalizedSearchEmail;
              if (matches) {
                console.info(
                  `✅ Email match found: "${caseEmail}" === "${normalizedSearchEmail}"`
                );
              }
              return matches;
            });

            if (emailMatch) {
              // In Cases API, caseId IS the application GUID (Id.ToString())
              const applicationGuid = emailMatch.caseId; // This is the GUID
              const caseNumber = emailMatch.caseNumber || emailMatch.caseId; // Human-readable case number
              console.info(
                `✅ Found case by email search: GUID=${applicationGuid}, caseNumber=${caseNumber} (partnerId in DB: ${emailMatch.partnerId}, expected: ${userPartnerId})`
              );
              return {
                id: applicationGuid, // Application GUID
                caseId: caseNumber, // Human-readable case number for display
                type: emailMatch.type,
                status: emailMatch.status,
                partnerId: emailMatch.partnerId,
                applicantFirstName: emailMatch.applicantFirstName,
                applicantLastName: emailMatch.applicantLastName,
                applicantEmail: emailMatch.applicantEmail,
                country: emailMatch.applicantCountry,
                businessLegalName: emailMatch.businessLegalName,
                createdAt: emailMatch.createdAt,
                updatedAt: emailMatch.updatedAt,
              };
            } else {
              // If no email match but we have cases, log what we're searching for
              console.warn(
                `⚠️ No email match found. Searching for: "${normalizedSearchEmail}"`
              );
              const availableEmails = allCasesResult.items
                .filter((c) => c.applicantEmail)
                .map((c) => `"${c.applicantEmail}" (case: ${c.caseNumber || c.caseId})`);
              if (availableEmails.length > 0) {
                console.warn(`Available emails in cases:`, availableEmails);
              } else {
                console.warn(`⚠️ No cases have applicantEmail populated`);
              }
            }
          }
        } catch (broadSearchError) {
          console.warn('Failed to do broader case search:', broadSearchError);
        }
      }

      // PRIMARY: If we queried by PartnerId, all returned cases belong to the user
      // OR if any case has a PartnerId that matches (even if our generation was approximate)
      if (userPartnerId && caseApiResult?.items && caseApiResult.items.length > 0) {
        // Check if any case has a matching PartnerId (case-insensitive)
        const partnerIdMatch = caseApiResult.items.find(
          (c) => c.partnerId && c.partnerId.toLowerCase() === userPartnerId.toLowerCase()
        );

        if (partnerIdMatch) {
          // Found case with matching PartnerId - this is the user's case
          const caseId = partnerIdMatch.caseNumber || partnerIdMatch.caseId;
          console.info(
            `✅ Found case by PartnerId match: ${caseId} (partnerId: ${partnerIdMatch.partnerId})`
          );
          return {
            caseId: caseId,
            type: partnerIdMatch.type,
            status: partnerIdMatch.status,
            partnerId: partnerIdMatch.partnerId,
            applicantFirstName: partnerIdMatch.applicantFirstName,
            applicantLastName: partnerIdMatch.applicantLastName,
            applicantEmail: partnerIdMatch.applicantEmail,
            country: partnerIdMatch.applicantCountry,
            businessLegalName: partnerIdMatch.businessLegalName,
            createdAt: partnerIdMatch.createdAt,
            updatedAt: partnerIdMatch.updatedAt,
          };
        }

        // If we queried by PartnerId but got results, they should all belong to the user
        // (Backend validates ownership, so if PartnerId filter returned results, they're valid)
        if (fallbackUrl.includes('partnerId=')) {
          const matchingCase = caseApiResult.items[0];
          const caseId = matchingCase.caseNumber || matchingCase.caseId;
          console.info(
            `✅ Found case by PartnerId query: ${caseId} (partnerId: ${matchingCase.partnerId}, query used: ${userPartnerId})`
          );
          return {
            caseId: caseId,
            type: matchingCase.type,
            status: matchingCase.status,
            partnerId: matchingCase.partnerId,
            applicantFirstName: matchingCase.applicantFirstName,
            applicantLastName: matchingCase.applicantLastName,
            applicantEmail: matchingCase.applicantEmail,
            country: matchingCase.applicantCountry,
            businessLegalName: matchingCase.businessLegalName,
            createdAt: matchingCase.createdAt,
            updatedAt: matchingCase.updatedAt,
          };
        }
      }

      // FALLBACK: If PartnerId not available, filter by email
      console.info(`Filtering by email: ${email}...`);
      const normalizedSearchEmail = email.toLowerCase().trim();

      // Find case where applicant email matches
      const matchingCase = caseApiResult?.items?.find((c) => {
        if (!c.applicantEmail) return false;

        // Normalize case email (trim and lowercase)
        const normalizedCaseEmail = c.applicantEmail.toLowerCase().trim();
        const emailMatch = normalizedCaseEmail === normalizedSearchEmail;

        if (emailMatch) {
          console.info(
            `✅ Found matching case by email: ${c.caseNumber || c.caseId} (email: ${c.applicantEmail}, partnerId: ${c.partnerId})`
          );
          return true;
        }
        return false;
      });

      // If no exact email match, log all available emails for debugging
      if (!matchingCase && caseApiResult?.items && caseApiResult.items.length > 0) {
        const availableEmails = caseApiResult.items.slice(0, 10).map((c) => ({
          caseNumber: c.caseNumber || c.caseId,
          email: c.applicantEmail,
          emailNormalized: c.applicantEmail?.toLowerCase().trim(),
          searchEmailNormalized: normalizedSearchEmail,
          matches: c.applicantEmail?.toLowerCase().trim() === normalizedSearchEmail,
        }));
        console.warn(
          `⚠️ No exact email match found. Search email: "${email}" (normalized: "${normalizedSearchEmail}"). Available cases:`,
          availableEmails
        );

        // Also log the raw email values for debugging
        console.info(
          'Raw email values from API:',
          caseApiResult.items.slice(0, 5).map((c) => ({
            caseNumber: c.caseNumber || c.caseId,
            applicantEmail: c.applicantEmail,
            applicantEmailType: typeof c.applicantEmail,
            applicantEmailLength: c.applicantEmail?.length,
            applicantEmailCharCodes: c.applicantEmail
              ?.split('')
              .map((char) => char.charCodeAt(0)),
          }))
        );
      }

      if (matchingCase) {
        const caseId = matchingCase.caseNumber || matchingCase.caseId;
        console.info('✅ Found case in case API:', caseId);
        return {
          caseId: caseId, // Use caseNumber if available, otherwise caseId
          type: matchingCase.type,
          status: matchingCase.status,
          partnerId: matchingCase.partnerId,
          applicantFirstName: matchingCase.applicantFirstName,
          applicantLastName: matchingCase.applicantLastName,
          applicantEmail: matchingCase.applicantEmail,
          country: matchingCase.applicantCountry,
          businessLegalName: matchingCase.businessLegalName,
          createdAt: matchingCase.createdAt,
          updatedAt: matchingCase.updatedAt,
        };
      } else {
        console.warn(
          `⚠️ No matching case found in case API. Searched ${caseApiResult?.items?.length || 0} cases for email ${email}`
        );
        if (caseApiResult?.items && caseApiResult.items.length > 0) {
          console.info(
            'Available cases (first 5):',
            caseApiResult.items.slice(0, 5).map((c) => ({
              caseNumber: c.caseNumber,
              email: c.applicantEmail,
              partnerId: c.partnerId,
            }))
          );
        } else {
          console.warn(
            'No cases found in database at all - case may not have been created'
          );
        }
      }
    } catch (fallbackError: unknown) {
      // If fallback also fails, continue to return null
      console.warn('Case API fallback also failed:', (fallbackError as any)?.message);
    }

    return null;
  } catch (error: unknown) {
    // Silently handle service unavailable errors (503) - services may not be running
    if ((error as any)?.isServiceUnavailable) {
      // Try case API as fallback even on 503
      try {
        // Search by email - fetch recent cases and filter client-side
        const caseApiResult = await apiGet<{
          items: Array<{
            caseId: string;
            caseNumber: string;
            type: string;
            status: string;
            partnerId: string;
            applicantFirstName?: string;
            applicantLastName?: string;
            applicantEmail?: string;
            applicantCountry?: string;
            businessLegalName?: string;
            createdAt: string;
            updatedAt: string;
          }>;
          totalCount: number;
        }>(`/api/v1/cases?take=100&sortBy=createdAt&sortDirection=desc`);

        console.info(
          `[Fallback] Found ${caseApiResult?.items?.length || 0} cases for partnerId ${userPartnerId}, filtering by email...`
        );

        const matchingCase = caseApiResult?.items?.find((c) => {
          const emailMatch = c.applicantEmail?.toLowerCase() === email.toLowerCase();
          const partnerMatch =
            !userPartnerId ||
            !c.partnerId ||
            c.partnerId.toLowerCase() === userPartnerId.toLowerCase();
          const matches = emailMatch && partnerMatch;
          if (matches) {
            console.info(`✅ [Fallback] Found matching case: ${c.caseNumber}`);
          }
          return matches;
        });

        if (matchingCase) {
          return {
            caseId: matchingCase.caseNumber,
            type: matchingCase.type,
            status: matchingCase.status,
            partnerId: matchingCase.partnerId,
            applicantFirstName: matchingCase.applicantFirstName,
            applicantLastName: matchingCase.applicantLastName,
            applicantEmail: matchingCase.applicantEmail,
            country: matchingCase.applicantCountry,
            businessLegalName: matchingCase.businessLegalName,
            createdAt: matchingCase.createdAt,
            updatedAt: matchingCase.updatedAt,
          };
        }
      } catch {
        // Ignore fallback errors
      }
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

export async function getCaseById(caseId: string): Promise<UserCase | null> {
  if (!caseId) return null;
  try {
    // Try Projections API first (has more complete data)
    const caseData = await apiGet<{
      id?: string; // Application GUID
      Id?: string; // Application GUID (C# naming)
      caseId: string;
      type: string;
      status: string;
      partnerId?: string;
      applicantFirstName?: string;
      applicantLastName?: string;
      applicantEmail?: string;
      applicantCountry?: string;
      country?: string;
      progressPercentage?: number;
      riskLevel?: string;
      riskScore?: number;
      createdAt?: string;
      updatedAt?: string;
      assignedTo?: string;
      assignedToName?: string;
      assignedAt?: string;
      metadataJson?: string;
      businessLegalName?: string;
      businessCountryOfRegistration?: string;
    }>(`/api/v1/projections/cases/${encodeURIComponent(caseId)}`);

    // Map to UserCase format with metadata
    // Get application GUID (handle both Id and id from API)
    const applicationId = caseData.id || caseData.Id;
    return {
      id: applicationId, // Application GUID
      caseId: caseData.caseId,
      type: caseData.type,
      status: caseData.status,
      partnerId: caseData.partnerId,
      applicantFirstName: caseData.applicantFirstName,
      applicantLastName: caseData.applicantLastName,
      applicantEmail: caseData.applicantEmail,
      country: caseData.country || caseData.applicantCountry || undefined,
      metadataJson: caseData.metadataJson,
      businessLegalName: caseData.businessLegalName,
      businessCountryOfRegistration: caseData.businessCountryOfRegistration,
      progressPercentage: caseData.progressPercentage,
      riskLevel: caseData.riskLevel,
      riskScore: caseData.riskScore,
      createdAt: caseData.createdAt,
      updatedAt: caseData.updatedAt,
      assignedTo: caseData.assignedTo,
      assignedToName: caseData.assignedToName,
      assignedAt: caseData.assignedAt,
    };
  } catch (error: unknown) {
    // If projections API fails (404/503), try direct cases API as fallback
    // This handles newly created cases that haven't been synced to projections yet
    if ((error as any)?.isServiceUnavailable || (error as any)?.isNotFound) {
      console.info(
        `Case ${caseId} not found in projections API, trying direct cases API...`
      );

      try {
        // Try by case number first (if caseId is a case number like "OBC-20251203-99307")
        let directCaseData;
        let fallbackError: any = null;

        if (
          caseId.includes('-') &&
          !caseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ) {
          // Likely a case number (contains dashes but not a GUID), try by-number endpoint
          try {
            directCaseData = await apiGet<{
              id: string;
              caseNumber: string;
              type: string;
              status: string;
              partnerId: string;
              applicantFirstName?: string;
              applicantLastName?: string;
              applicantEmail?: string;
              applicantCountry?: string;
              businessLegalName?: string;
              createdAt: string;
              updatedAt: string;
            }>(`/api/v1/cases/by-number/${encodeURIComponent(caseId)}`);
          } catch (byNumberError) {
            fallbackError = byNumberError;
            console.warn(
              `Case ${caseId} not found via by-number endpoint, trying by GUID...`
            );
          }
        }

        // If not found by case number, or if it's a GUID, try by ID endpoint
        if (!directCaseData) {
          try {
            directCaseData = await apiGet<{
              id: string;
              caseNumber: string;
              type: string;
              status: string;
              partnerId: string;
              applicantFirstName?: string;
              applicantLastName?: string;
              applicantEmail?: string;
              applicantCountry?: string;
              businessLegalName?: string;
              createdAt: string;
              updatedAt: string;
            }>(`/api/v1/cases/${encodeURIComponent(caseId)}`);
          } catch (byIdError) {
            if (!fallbackError) fallbackError = byIdError;
            console.warn(`Case ${caseId} not found via by-id endpoint either`);
          }
        }

        if (directCaseData) {
          // Map to UserCase format
          console.info(
            `✅ Found case in direct cases API: ${directCaseData.caseNumber || directCaseData.id}`
          );
          return {
            caseId: directCaseData.caseNumber || caseId,
            type: directCaseData.type,
            status: directCaseData.status,
            partnerId: directCaseData.partnerId,
            applicantFirstName: directCaseData.applicantFirstName,
            applicantLastName: directCaseData.applicantLastName,
            applicantEmail: directCaseData.applicantEmail,
            country: directCaseData.applicantCountry,
            businessLegalName: directCaseData.businessLegalName,
            createdAt: directCaseData.createdAt,
            updatedAt: directCaseData.updatedAt,
          };
        } else {
          console.warn(
            `Case ${caseId} not found in direct cases API after trying both endpoints`
          );
          return null;
        }
      } catch (fallbackError) {
        console.warn(
          `Case ${caseId} also not found in direct cases API:`,
          (fallbackError as any)?.message
        );
        return null;
      }
    }
    // Re-throw other errors
    throw error;
  }
}

// Messaging API (via gateway or direct service)
export type MessageAttachmentDto = {
  id: string;
  messageId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageUrl?: string;
  documentId?: string;
  description?: string;
  uploadedAt: string;
};

export type MessageDto = {
  id: string;
  threadId: string;
  thread_id?: string; // snake_case from backend
  senderId: string;
  sender_id?: string; // snake_case from backend
  senderName: string;
  sender_name?: string; // snake_case from backend
  senderRole?: string;
  sender_role?: string; // snake_case from backend
  receiverId?: string;
  receiver_id?: string; // snake_case from backend
  receiverName?: string;
  receiver_name?: string; // snake_case from backend
  content: string;
  type?: string;
  status: string;
  sentAt: string;
  sent_at?: string; // snake_case from backend
  readAt?: string | null;
  read_at?: string | null; // snake_case from backend
  isRead: boolean;
  is_read?: boolean; // snake_case from backend
  isStarred?: boolean;
  is_starred?: boolean; // snake_case from backend
  replyToMessageId?: string;
  reply_to_message_id?: string; // snake_case from backend
  attachments?: MessageAttachmentDto[];
};

export type MessageThreadDto = {
  id: string;
  applicationId: string;
  applicationReference?: string;
  applicantId?: string;
  applicantName?: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  isActive?: boolean;
  isArchived?: boolean;
  isStarred?: boolean;
  createdAt?: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  lastMessage?: MessageDto | null;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export async function getMyThreads(page = 1, pageSize = 20) {
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  }).toString();
  return apiGet<PagedResult<MessageThreadDto>>(
    `${MESSAGING_PREFIX}/messages/threads/my?${qs}`
  );
}

export async function getThreadByApplication(applicationId: string) {
  // Check if applicationId is a GUID or a case ID (case number)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let applicationGuid = applicationId;

  // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
  if (!guidRegex.test(applicationId)) {
    try {
      const caseData = await apiGet<{
        id?: string; // Application GUID (lowercase)
        Id?: string; // Application GUID (C# naming, uppercase)
        caseId: string;
      }>(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);

      // Handle both Id and id (case-insensitive)
      const guid = caseData?.id || caseData?.Id;
      if (guid) {
        applicationGuid = guid;
      } else {
        throw new Error(`Could not find application GUID for case ID: ${applicationId}`);
      }
    } catch (error) {
      // If projections API fails (404), try Cases API as fallback
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        console.info(
          `[getThreadByApplication] Projections API returned 404, trying Cases API for case ID: ${applicationId}`
        );
        try {
          // Try Cases API - it uses case_id (snake_case) which is the GUID
          const caseData = await apiGet<{
            case_id?: string; // Backend uses snake_case
            id?: string; // Fallback
            Id?: string; // Fallback
          }>(`/api/v1/cases/${encodeURIComponent(applicationId)}`);

          const guid = caseData?.case_id || caseData?.id || caseData?.Id;
          if (guid) {
            applicationGuid = guid;
            console.info(
              `[getThreadByApplication] Found GUID from Cases API: ${applicationGuid}`
            );
          } else {
            throw new Error(
              `Could not find application GUID for case ID: ${applicationId}`
            );
          }
        } catch (caseError) {
          console.error('Failed to fetch application GUID from Cases API:', caseError);
          throw new Error(
            `Invalid application ID: ${applicationId}. Could not resolve to GUID from projections or cases API.`
          );
        }
      } else {
        console.error('Failed to fetch application GUID from case ID:', error);
        throw new Error(
          `Invalid application ID: ${applicationId}. Could not resolve to GUID.`
        );
      }
    }
  }

  // Get thread - if it doesn't exist (404), the calling code will handle it gracefully
  // Thread will be created automatically on first message
  return apiGet<MessageThreadDto>(
    `${MESSAGING_PREFIX}/messages/threads/application/${encodeURIComponent(applicationGuid)}`
  );
}

export async function getThreadMessages(threadId: string, page = 1, pageSize = 50) {
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  }).toString();
  return apiGet<PagedResult<MessageDto>>(
    `${MESSAGING_PREFIX}/messages/threads/${encodeURIComponent(threadId)}/messages?${qs}`
  );
}

export async function sendMessage(
  applicationId: string,
  content: string,
  receiverId?: string,
  replyToMessageId?: string,
  attachments?: Array<{
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
    storageKey: string;
    storageUrl: string;
    documentId?: string;
    description?: string;
  }>
) {
  // Check if applicationId is a GUID or a case ID (case number)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let applicationGuid = applicationId;

  // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
  if (!guidRegex.test(applicationId)) {
    try {
      const caseData = await apiGet<{
        id?: string; // Application GUID (lowercase)
        Id?: string; // Application GUID (C# naming, uppercase)
        caseId: string;
      }>(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);

      // Handle both Id and id (case-insensitive)
      const guid = caseData?.id || caseData?.Id;
      if (guid) {
        applicationGuid = guid;
      } else {
        throw new Error(`Could not find application GUID for case ID: ${applicationId}`);
      }
    } catch (error) {
      console.error('Failed to fetch application GUID from case ID:', error);
      throw new Error(
        `Invalid application ID: ${applicationId}. Could not resolve to GUID.`
      );
    }
  }

  const body: any = {
    ApplicationId: applicationGuid,
    Content: content,
  };
  if (receiverId) body.ReceiverId = receiverId;
  if (replyToMessageId) body.ReplyToMessageId = replyToMessageId;
  if (attachments && attachments.length > 0) {
    body.Attachments = attachments.map((a) => ({
      FileName: a.fileName,
      ContentType: a.contentType,
      FileSizeBytes: a.fileSizeBytes,
      StorageKey: a.storageKey,
      StorageUrl: a.storageUrl,
      DocumentId: a.documentId,
      Description: a.description,
    }));
  }
  return apiPost<{
    Success?: boolean;
    success?: boolean;
    MessageId?: string;
    messageId?: string;
    ThreadId?: string;
    threadId?: string;
  }>(`${MESSAGING_PREFIX}/messages`, body);
}

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    await apiDelete(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to delete message',
    };
  }
}

export async function starMessage(
  messageId: string
): Promise<{ success: boolean; isStarred: boolean; errorMessage?: string }> {
  try {
    const response = await apiPut<{
      Success?: boolean;
      IsStarred?: boolean;
      success?: boolean;
      isStarred?: boolean;
      ErrorMessage?: string;
    }>(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}/star`);
    return {
      success: response.Success ?? response.success ?? false,
      isStarred: response.IsStarred ?? response.isStarred ?? false,
      errorMessage: response.ErrorMessage,
    };
  } catch (error) {
    return {
      success: false,
      isStarred: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to star message',
    };
  }
}

export async function archiveThread(
  threadId: string,
  archive: boolean = true
): Promise<{ success: boolean; isArchived: boolean; errorMessage?: string }> {
  try {
    const response = await apiPut<{
      Success?: boolean;
      IsArchived?: boolean;
      success?: boolean;
      isArchived?: boolean;
      ErrorMessage?: string;
    }>(`${MESSAGING_PREFIX}/messages/threads/${encodeURIComponent(threadId)}/archive`, {
      Archive: archive,
    });
    return {
      success: response.Success ?? response.success ?? false,
      isArchived: response.IsArchived ?? response.isArchived ?? false,
      errorMessage: response.ErrorMessage,
    };
  } catch (error) {
    return {
      success: false,
      isArchived: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to archive thread',
    };
  }
}

export async function forwardMessage(
  messageId: string,
  toApplicationId: string,
  toReceiverId?: string,
  additionalContent?: string
): Promise<{
  success: boolean;
  newMessageId?: string;
  newThreadId?: string;
  errorMessage?: string;
}> {
  try {
    const response = await apiPost<{
      Success?: boolean;
      NewMessageId?: string;
      NewThreadId?: string;
      success?: boolean;
      newMessageId?: string;
      newThreadId?: string;
      ErrorMessage?: string;
    }>(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}/forward`, {
      ToApplicationId: toApplicationId,
      ToReceiverId: toReceiverId,
      AdditionalContent: additionalContent,
    });
    return {
      success: response.Success ?? response.success ?? false,
      newMessageId: response.NewMessageId ?? response.newMessageId,
      newThreadId: response.NewThreadId ?? response.newThreadId,
      errorMessage: response.ErrorMessage,
    };
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Failed to forward message',
    };
  }
}

export async function getUnreadCount() {
  return apiGet<{ count: number }>(`${MESSAGING_PREFIX}/messages/unread/count`);
}

export async function markMessageRead(messageId: string) {
  return apiPut(`${MESSAGING_PREFIX}/messages/${encodeURIComponent(messageId)}/read`);
}

// Application sections and documents for context
export type ApplicationSection = {
  id: string;
  title: string;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    value?: any;
  }>;
};

export type ApplicationDocument = {
  id: string;
  name: string;
  type: string;
  status: string;
  url?: string;
  fileName?: string;
  createdAt?: string;
};

/**
 * Get all user's applications/cases for selection
 * @param email - Optional email to use. If not provided, will try to get from session.
 */
export async function getUserApplications(email?: string): Promise<UserCase[]> {
  try {
    let userEmail = email;

    if (!userEmail) {
      // Try to get from session API directly
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          userEmail = session?.user?.email;
          console.info('[getUserApplications] Got email from session API:', userEmail);
        }
      } catch (error) {
        console.warn('[getUserApplications] Failed to get session:', error);
      }
    }

    if (!userEmail) {
      // Fallback to getAuthUser
      const { getAuthUser } = await import('@/lib/auth/session');
      const user = getAuthUser();
      userEmail = user?.email;
      console.info('[getUserApplications] Got email from getAuthUser:', userEmail);
    }

    if (!userEmail) {
      console.warn('[getUserApplications] No user email available');
      return [];
    }

    // Get PartnerId from backend
    let userPartnerId: string | null = null;
    try {
      console.info('[getUserApplications] Getting PartnerId from backend...');
      const partnerIdResponse = await apiGet<{
        email: string;
        partnerId: string;
        partnerIdGuid: string;
      }>('/api/v1/partner/id');

      if (partnerIdResponse && partnerIdResponse.partnerId) {
        userPartnerId = partnerIdResponse.partnerId;
        console.info('[getUserApplications] Got PartnerId:', userPartnerId);
      }
    } catch (error) {
      console.warn('[getUserApplications] Could not get PartnerId from backend:', error);
    }

    // Query by PartnerId if available, otherwise by email
    const params = new URLSearchParams({ take: '50' });
    if (userPartnerId) {
      params.append('partnerId', userPartnerId);
      console.info('[getUserApplications] Querying by PartnerId:', userPartnerId);
    } else if (userEmail) {
      params.append('searchTerm', userEmail);
      console.info('[getUserApplications] Querying by email:', userEmail);
    } else {
      console.warn('[getUserApplications] No email or PartnerId available');
      return []; // No email available, return empty
    }

    const apiUrl = `/api/v1/projections/cases?${params.toString()}`;
    console.info('[getUserApplications] Calling API:', apiUrl);

    const result = await apiGet<{
      items: Array<{
        id?: string;
        Id?: string;
        caseId: string;
        type: string;
        status: string;
        partnerId?: string;
        applicantFirstName?: string;
        applicantLastName?: string;
        applicantEmail?: string;
        applicantCountry?: string;
        country?: string;
        progressPercentage?: number;
        riskLevel?: string;
        riskScore?: number;
        createdAt?: string;
        updatedAt?: string;
        assignedTo?: string;
        assignedToName?: string;
        assignedAt?: string;
        metadataJson?: string;
        businessLegalName?: string;
        businessCountryOfRegistration?: string;
      }>;
    }>(apiUrl);

    console.info(
      '[getUserApplications] Projections API response:',
      result?.items?.length || 0,
      'items'
    );

    let filteredItems = result?.items || [];

    // If projections API returned no results, try case API directly
    if (filteredItems.length === 0) {
      console.info(
        '[getUserApplications] No results from projections API, trying case API...'
      );
      try {
        // First try with PartnerId filter
        let caseApiResult: { items?: Array<any> } | null = null;
        if (userPartnerId) {
          try {
            const caseApiUrl = `/api/v1/cases?partnerId=${encodeURIComponent(userPartnerId)}&take=50&sortBy=createdAt&sortDirection=desc`;
            console.info(
              '[getUserApplications] Trying case API with PartnerId:',
              caseApiUrl
            );
            caseApiResult = await apiGet<{
              items: Array<{
                case_id?: string; // Backend uses snake_case
                caseId?: string; // Fallback
                case_number?: string; // Backend uses snake_case
                caseNumber?: string; // Fallback
                type: string;
                status: string;
                partner_id?: string; // Backend uses snake_case
                partnerId?: string; // Fallback
                applicant_first_name?: string; // Backend uses snake_case
                applicantFirstName?: string; // Fallback
                applicant_last_name?: string; // Backend uses snake_case
                applicantLastName?: string; // Fallback
                applicant_email?: string; // Backend uses snake_case
                applicantEmail?: string; // Fallback
                applicant_country?: string; // Backend uses snake_case
                applicantCountry?: string; // Fallback
                business_legal_name?: string; // Backend uses snake_case
                businessLegalName?: string; // Fallback
                created_at?: string; // Backend uses snake_case
                createdAt?: string; // Fallback
                updated_at?: string; // Backend uses snake_case
                updatedAt?: string; // Fallback
              }>;
            }>(caseApiUrl);
            console.info(
              '[getUserApplications] Case API with PartnerId returned:',
              caseApiResult?.items?.length || 0,
              'items'
            );
            if (caseApiResult?.items && caseApiResult.items.length > 0) {
              console.info(
                '[getUserApplications] Raw Case API response (first item):',
                JSON.stringify(caseApiResult.items[0], null, 2)
              );
            }
          } catch (error) {
            console.warn('[getUserApplications] Case API with PartnerId failed:', error);
          }
        }

        // If no results with PartnerId, try getting all cases
        if (!caseApiResult?.items || caseApiResult.items.length === 0) {
          try {
            const allCasesUrl = `/api/v1/cases?take=50&sortBy=createdAt&sortDirection=desc`;
            console.info(
              '[getUserApplications] Trying case API without filter to get all cases:',
              allCasesUrl
            );
            caseApiResult = await apiGet<{
              items: Array<{
                case_id?: string; // Backend uses snake_case
                caseId?: string; // Fallback
                case_number?: string; // Backend uses snake_case
                caseNumber?: string; // Fallback
                type: string;
                status: string;
                partner_id?: string; // Backend uses snake_case
                partnerId?: string; // Fallback
                applicant_first_name?: string; // Backend uses snake_case
                applicantFirstName?: string; // Fallback
                applicant_last_name?: string; // Backend uses snake_case
                applicantLastName?: string; // Fallback
                applicant_email?: string; // Backend uses snake_case
                applicantEmail?: string; // Fallback
                applicant_country?: string; // Backend uses snake_case
                applicantCountry?: string; // Fallback
                business_legal_name?: string; // Backend uses snake_case
                businessLegalName?: string; // Fallback
                created_at?: string; // Backend uses snake_case
                createdAt?: string; // Fallback
                updated_at?: string; // Backend uses snake_case
                updatedAt?: string; // Fallback
              }>;
            }>(allCasesUrl);
            console.info(
              '[getUserApplications] Case API (all cases) returned:',
              caseApiResult?.items?.length || 0,
              'items'
            );
            if (caseApiResult?.items && caseApiResult.items.length > 0) {
              console.info(
                '[getUserApplications] Raw Case API response (all cases, first item):',
                JSON.stringify(caseApiResult.items[0], null, 2)
              );
            }
          } catch (error) {
            console.warn('[getUserApplications] Case API (all cases) failed:', error);
          }
        }

        if (caseApiResult?.items && caseApiResult.items.length > 0) {
          // Log first item structure for debugging
          if (caseApiResult.items.length > 0) {
            console.info(
              '[getUserApplications] Case API response structure (first item):',
              JSON.stringify(caseApiResult.items[0], null, 2)
            );
          }

          // SECURITY: Filter by PartnerId or email - NEVER return unmatched cases
          let caseFilteredItems: any[] = [];
          if (userPartnerId) {
            const partnerIdMatches = caseApiResult.items.filter((item: any) => {
              // Backend uses snake_case, so prioritize that
              const itemPartnerId = item.partner_id || item.partnerId || item.PartnerId;
              return itemPartnerId?.toLowerCase() === userPartnerId?.toLowerCase();
            });
            if (partnerIdMatches.length > 0) {
              caseFilteredItems = partnerIdMatches;
              console.info(
                '[getUserApplications] Found',
                caseFilteredItems.length,
                'cases matching PartnerId'
              );
            } else if (userEmail) {
              // No PartnerId match, try email as fallback
              const emailMatches = caseApiResult.items.filter((item: any) => {
                // Backend uses snake_case, so prioritize that
                const itemEmail =
                  item.applicant_email || item.applicantEmail || item.ApplicantEmail;
                return itemEmail?.toLowerCase() === userEmail.toLowerCase();
              });
              if (emailMatches.length > 0) {
                caseFilteredItems = emailMatches;
                console.info(
                  '[getUserApplications] Found',
                  caseFilteredItems.length,
                  'cases matching email'
                );
              } else {
                // SECURITY: No matches found - return empty array, NOT all cases
                console.warn(
                  '[getUserApplications] No PartnerId or email match found - returning empty array for security'
                );
                caseFilteredItems = [];
              }
            } else {
              // SECURITY: No email available - return empty array
              console.warn(
                '[getUserApplications] No email available - returning empty array for security'
              );
              caseFilteredItems = [];
            }
          } else if (userEmail) {
            const emailMatches = caseApiResult.items.filter((item: any) => {
              // Backend uses snake_case, so prioritize that
              const itemEmail =
                item.applicant_email || item.applicantEmail || item.ApplicantEmail;
              return itemEmail?.toLowerCase() === userEmail.toLowerCase();
            });
            if (emailMatches.length > 0) {
              caseFilteredItems = emailMatches;
              console.info(
                '[getUserApplications] Found',
                caseFilteredItems.length,
                'cases matching email'
              );
            } else {
              // SECURITY: No email match - return empty array
              console.warn(
                '[getUserApplications] No email match found - returning empty array for security'
              );
              caseFilteredItems = [];
            }
          } else {
            // SECURITY: No filter criteria - return empty array
            console.error(
              '[getUserApplications] No filter criteria available - returning empty array for security'
            );
            caseFilteredItems = [];
          }

          // Map case API results to UserCase format
          // NOTE: In Cases API, caseId IS the application GUID (Id.ToString())
          // caseNumber is the human-readable case number
          // Backend uses snake_case (JsonNamingPolicy.SnakeCaseLower), so prioritize snake_case
          filteredItems = caseFilteredItems.map((item: any) => {
            // Backend returns snake_case, so prioritize that, then fall back to camelCase/PascalCase
            const applicationGuid =
              item.case_id || item.caseId || item.CaseId || item.id || item.Id;
            const caseNumber =
              item.case_number || item.caseNumber || item.CaseNumber || applicationGuid;
            const partnerId = item.partner_id || item.partnerId || item.PartnerId;
            const type = item.type || item.Type;
            const status = item.status || item.Status;
            const applicantFirstName =
              item.applicant_first_name ||
              item.applicantFirstName ||
              item.ApplicantFirstName;
            const applicantLastName =
              item.applicant_last_name ||
              item.applicantLastName ||
              item.ApplicantLastName;
            const applicantEmail =
              item.applicant_email || item.applicantEmail || item.ApplicantEmail;
            const applicantCountry =
              item.applicant_country || item.applicantCountry || item.ApplicantCountry;
            const businessLegalName =
              item.business_legal_name ||
              item.businessLegalName ||
              item.BusinessLegalName;
            const createdAt = item.created_at || item.createdAt || item.CreatedAt;
            const updatedAt = item.updated_at || item.updatedAt || item.UpdatedAt;

            console.info(
              `[getUserApplications] Mapping case: caseId=${applicationGuid}, caseNumber=${caseNumber}, partnerId=${partnerId || '(missing)'}`
            );

            if (!applicationGuid) {
              console.error(
                '[getUserApplications] CRITICAL: No application GUID found in case item:',
                JSON.stringify(item, null, 2)
              );
            }

            return {
              id: applicationGuid, // caseId IS the application GUID
              Id: applicationGuid,
              caseId: caseNumber, // Use caseNumber for display, fallback to caseId if not available
              type: type,
              status: status,
              partnerId: partnerId,
              applicantFirstName: applicantFirstName,
              applicantLastName: applicantLastName,
              applicantEmail: applicantEmail,
              applicantCountry: applicantCountry,
              country: applicantCountry,
              businessLegalName: businessLegalName,
              createdAt: createdAt,
              updatedAt: updatedAt,
            };
          });

          console.info(
            '[getUserApplications] Mapped case API results:',
            filteredItems.length,
            'items'
          );
        }
      } catch (error) {
        console.warn('[getUserApplications] Case API fallback failed:', error);
      }
    } else {
      // Filter by PartnerId if available, otherwise by email
      if (userPartnerId) {
        filteredItems = result.items.filter(
          (item) => item.partnerId?.toLowerCase() === userPartnerId?.toLowerCase()
        );
        console.info(
          '[getUserApplications] Filtered by PartnerId:',
          filteredItems.length,
          'items'
        );
      } else if (userEmail) {
        filteredItems = result.items.filter(
          (item) => item.applicantEmail?.toLowerCase() === userEmail.toLowerCase()
        );
        console.info(
          '[getUserApplications] Filtered by email:',
          filteredItems.length,
          'items'
        );
      }
    }

    if (filteredItems.length === 0) {
      console.warn(
        '[getUserApplications] No matching applications found after filtering'
      );
      return [];
    }

    // If items are already mapped from Case API (they have id and caseId set correctly),
    // just add missing fields without remapping the core structure
    const mapped = filteredItems.map((item: any) => {
      // If item already has the correct structure from Case API mapping, preserve it
      if (item.id && item.caseId && item.Id) {
        // Already mapped from Case API - just add any missing optional fields
        return {
          ...item,
          progressPercentage: item.progressPercentage,
          riskLevel: item.riskLevel,
          riskScore: item.riskScore,
          assignedTo: item.assignedTo,
          assignedToName: item.assignedToName,
          assignedAt: item.assignedAt,
          metadataJson: item.metadataJson,
          businessCountryOfRegistration: item.businessCountryOfRegistration,
        };
      }

      // Otherwise, map from projections API format
      return {
        id: item.id || item.Id || item.caseId,
        Id: item.Id || item.id || item.caseId,
        caseId: item.caseId || item.caseNumber || item.id || item.Id,
        type: item.type,
        status: item.status,
        partnerId: item.partnerId,
        applicantFirstName: item.applicantFirstName,
        applicantLastName: item.applicantLastName,
        applicantEmail: item.applicantEmail,
        country: item.country || item.applicantCountry,
        progressPercentage: item.progressPercentage,
        riskLevel: item.riskLevel,
        riskScore: item.riskScore,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        assignedTo: item.assignedTo,
        assignedToName: item.assignedToName,
        assignedAt: item.assignedAt,
        metadataJson: item.metadataJson,
        businessLegalName: item.businessLegalName,
        businessCountryOfRegistration: item.businessCountryOfRegistration,
      };
    });

    console.info('[getUserApplications] Returning', mapped.length, 'applications');
    // Log first mapped item for debugging
    if (mapped.length > 0) {
      console.info(
        '[getUserApplications] First mapped item:',
        JSON.stringify(mapped[0], null, 2)
      );
    }
    return mapped;
  } catch (error) {
    console.error('[getUserApplications] Failed to get user applications:', error);
    if (error instanceof Error) {
      console.error('[getUserApplications] Error details:', error.message, error.stack);
    }
    return [];
  }
}

export async function getApplicationSections(
  applicationId: string
): Promise<ApplicationSection[]> {
  try {
    // Get case details from projections API or onboarding API
    const app = await apiGet<{
      id: string;
      sections?: Array<{
        id: string;
        title: string;
        fields?: Array<{ id: string; label: string; type: string; value?: any }>;
      }>;
      checklist_items?: Array<{
        id: string;
        category: string;
        requirement: string;
        status: string;
      }>;
    }>(`/api/v1/projections/cases/${encodeURIComponent(applicationId)}`);

    // If sections are directly available
    if (app?.sections) {
      return app.sections.map((s) => ({
        id: s.id,
        title: s.title,
        fields: s.fields || [],
      }));
    }

    // Try to construct sections from checklist items if available
    if (app?.checklist_items && app.checklist_items.length > 0) {
      const categoryMap = new Map<string, ApplicationSection>();

      app.checklist_items.forEach((item) => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, {
            id: `section-${item.category.toLowerCase().replace(/\s+/g, '-')}`,
            title: item.category,
            fields: [],
          });
        }
        const section = categoryMap.get(item.category)!;
        section.fields.push({
          id: item.id,
          label: item.requirement,
          type: 'text',
          value: item.status,
        });
      });

      return Array.from(categoryMap.values());
    }

    // Fallback: return empty array
    return [];
  } catch (error) {
    // If projections API fails (404), try to sync projections and retry
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      console.info(
        `[getApplicationSections] Projections API returned 404, attempting to sync projections...`
      );

      try {
        // Trigger projections sync (non-blocking)
        // This will sync the case to projections so it appears in future requests
        // Note: Sync endpoint expects query parameter, not body
        const syncUrl =
          typeof window !== 'undefined'
            ? '/api/proxy/api/v1/sync?forceFullSync=false'
            : `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/api/proxy/api/v1/sync?forceFullSync=false`;
        await fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }).catch(() => {
          // Ignore sync errors - background worker will handle it
        });

        // Try fetching from Cases API as fallback while sync happens
        try {
          const caseData = await apiGet<{
            id: string;
            case_number: string;
            status?: string;
          }>(`/api/v1/cases/${encodeURIComponent(applicationId)}`);

          if (caseData) {
            console.info(
              `[getApplicationSections] Case ${applicationId} exists in Cases API, sync triggered. Returning empty sections for now.`
            );
            return [];
          }
        } catch {
          // Case doesn't exist
        }
      } catch (syncError) {
        console.warn(`[getApplicationSections] Failed to trigger sync:`, syncError);
      }

      // Return empty sections - case exists but not in projections yet
      return [];
    }
    console.error('Failed to fetch application sections:', error);
    return [];
  }
}

export async function getApplicationDocuments(
  applicationId: string
): Promise<ApplicationDocument[]> {
  try {
    // Convert applicationId to Guid for document service
    // Use the correct endpoint: /api/v1/documents/case/{caseId}
    const documents = await apiGet<
      Array<{
        id: string;
        documentNumber?: string;
        fileName: string;
        type: string;
        contentType?: string;
        createdAt?: string;
        storageKey?: string;
      }>
    >(`/api/v1/documents/case/${encodeURIComponent(applicationId)}`);

    if (Array.isArray(documents)) {
      return documents.map((doc) => ({
        id: doc.id,
        name: doc.fileName || doc.documentNumber || 'Document',
        type: doc.type || 'unknown',
        status: 'uploaded', // Default status
        fileName: doc.fileName,
        createdAt: doc.createdAt,
      }));
    }

    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If document service returns 404, it means no documents exist yet (this is normal)
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      console.info(
        `[getApplicationDocuments] No documents found for case ${applicationId} (this is normal if documents haven't been uploaded yet)`
      );
      return [];
    }

    // For other errors, log and return empty array
    console.error('Failed to fetch application documents:', error);
    return [];
  }
}

// User Profile API
export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  profileImageUrl?: string;
  phone?: string;
  country?: string;
  companyName?: string;
  entityType?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  preferences?: UserPreferences;
};

export type UserPreferences = {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  statusUpdates?: boolean;
  marketingCommunications?: boolean;
  language?: string;
  timezone?: string;
};

export type UpdateProfileRequest = {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  country?: string;
  companyName?: string;
  preferences?: UserPreferences;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type CaseDataSummary = {
  caseId: string;
  applicationData: any;
  documents: any[];
  messages: any[];
  timeline: any[];
};

// Get current user profile
export async function getUserProfile(): Promise<UserProfile> {
  try {
    // Call Next.js API route directly (not through proxy)
    const response = await fetch('/api/users/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }

    // If not 404, throw error
    if (response.status !== 404) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    // For 404, throw to fall through to fallback
    throw new Error('Profile not found, using fallback');
  } catch (error) {
    // Don't log 503 or 404 errors - services may not be running or user may not exist yet
    if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
      console.error('Failed to fetch user profile from auth service:', error);
    }
    // Fallback: try to get from case data
    try {
      const { getAuthUser } = await import('@/lib/auth/session');
      const user = getAuthUser();
      if (user && user.email) {
        const caseData = await findUserCaseByEmail(user.email);
        if (caseData) {
          return {
            id: user.sub || user.email,
            email: user.email,
            firstName: user.givenName || user.name?.split(' ')[0] || '',
            lastName: user.familyName || user.name?.split(' ').slice(1).join(' ') || '',
            fullName: user.name || '',
            phone: undefined,
            country: caseData.country,
            preferences: undefined,
          };
        }
      }
    } catch (error) {
      // Don't log 503 or 404 errors - services may not be running or user may not exist yet
      if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
        console.error('Failed to get user from case data:', error);
      }
    }
    // Last resort: return from JWT token
    const { getAuthUser } = await import('@/lib/auth/session');
    const user = getAuthUser();
    return {
      id: user?.sub || user?.email || '',
      email: user?.email || '',
      firstName: user?.givenName || user?.name?.split(' ')[0] || '',
      lastName: user?.familyName || user?.name?.split(' ').slice(1).join(' ') || '',
      fullName: user?.name || '',
      preferences: undefined,
    };
  }
}

// Get handler/user profile by ID (for displaying assigned handlers)
export async function getHandlerProfile(userId: string): Promise<{
  id: string;
  fullName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
} | null> {
  if (!userId) return null;
  try {
    // Call Next.js API route directly (not through proxy) - same pattern as getUserProfile
    const response = await fetch(`/api/users/${userId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Handler doesn't exist - that's okay, return null
        return null;
      }
      throw new Error(`Failed to fetch handler profile: ${response.status}`);
    }

    const profile = await response.json();
    return {
      id: profile.id,
      fullName:
        profile.fullName ||
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
        'Unknown User',
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      profileImageUrl: profile.profileImageUrl,
    };
  } catch (error: unknown) {
    // Don't log 404 or 503 errors - handler may not exist or service unavailable
    if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
      console.error('Failed to fetch handler profile:', error);
    }
    return null;
  }
}

// Update user profile
export async function updateUserProfile(
  updates: UpdateProfileRequest
): Promise<UserProfile> {
  try {
    // Call Next.js API route directly (not through proxy)
    const response = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    return await response.json();
  } catch (error: unknown) {
    // If user doesn't exist in backend (404), try to create them or fallback
    if ((error as any)?.message?.includes('404')) {
      console.warn('User profile not found in backend. Creating new profile...');
      // For now, we'll just return the updated profile from the request
      // In a full implementation, you might want to POST to create the user first
      const { getAuthUser } = await import('@/lib/auth/session');
      const user = getAuthUser();

      return {
        id: user?.sub || user?.email || '',
        email: user?.email || '',
        firstName: updates.firstName || user?.givenName || '',
        lastName: updates.lastName || user?.familyName || '',
        middleName: updates.middleName,
        fullName:
          `${updates.firstName || ''} ${updates.lastName || ''}`.trim() ||
          user?.name ||
          '',
        phone: updates.phone,
        country: updates.country,
        companyName: updates.companyName,
        preferences: updates.preferences,
      };
    }
    throw error;
  }
}

// Get user notification preferences
export async function getNotificationPreferences(): Promise<UserPreferences> {
  try {
    const profile = await getUserProfile();
    return (
      profile.preferences || {
        emailNotifications: true,
        smsNotifications: false,
        statusUpdates: true,
        marketingCommunications: false,
      }
    );
  } catch (error) {
    // Don't log 404 or 503 errors - services may not be running or user may not exist yet
    if (!(error as any)?.isNotFound && !(error as any)?.isServiceUnavailable) {
      console.error('Failed to fetch notification preferences:', error);
    }
    // Return defaults
    return {
      emailNotifications: true,
      smsNotifications: false,
      statusUpdates: true,
      marketingCommunications: false,
    };
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  preferences: UserPreferences
): Promise<UserProfile> {
  try {
    // Update preferences as part of profile
    const currentProfile = await getUserProfile();
    try {
      return await updateUserProfile({
        firstName: currentProfile.firstName || '',
        lastName: currentProfile.lastName || '',
        middleName: currentProfile.middleName,
        phone: currentProfile.phone,
        country: currentProfile.country,
        companyName: currentProfile.companyName,
        preferences,
      });
    } catch (error: unknown) {
      // If update fails (404 or other), the updateUserProfile will handle the fallback
      // For notification preferences specifically, we can store locally as backup
      if ((error as any)?.message?.includes('404')) {
        console.warn('Profile not found in backend. Storing preferences locally...');
        // Store preferences in localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_preferences', JSON.stringify(preferences));
        }
        // Return profile with updated preferences
        return {
          ...currentProfile,
          preferences,
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    // Still try to store locally
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user_preferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to store preferences locally:', error);
      }
    }
    throw error;
  }
}

// Change password
export async function changePassword(
  request: ChangePasswordRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    // Try authentication service endpoint if available
    return await apiPost<{ success: boolean; message?: string }>(
      '/api/users/me/change-password',
      request
    );
  } catch (error) {
    console.error('Failed to change password:', error);
    // If endpoint doesn't exist, this would typically go through Keycloak
    throw new Error(
      'Password change not available. Please contact support or use Keycloak directly.'
    );
  }
}

// Download user data (GDPR compliance)
export async function downloadUserData(): Promise<Blob> {
  try {
    // Proxy handles authentication - no need for manual token
    const response = await fetch(`${API_BASE}/api/users/me/data-export`, {
      method: 'GET',
      credentials: 'include', // Include session cookie
    });

    if (!response.ok) {
      throw new Error('Failed to download user data');
    }

    return await response.blob();
  } catch (error) {
    console.error('Failed to download user data:', error);
    // Fallback: create a simple JSON export
    const profile = await getUserProfile();
    const caseData = await findUserCaseByEmail(profile.email).catch(() => null);

    const data = {
      profile,
      caseData,
      exportedAt: new Date().toISOString(),
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }
}

// Delete user account
export async function deleteUserAccount(confirmation: {
  password?: string;
  reason?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiPost<{ success: boolean; message?: string }>(
      '/api/users/me/delete',
      confirmation
    );
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw new Error('Account deletion failed. Please contact support.');
  }
}

// Get user's case summary for profile display
export async function getUserCaseSummary(): Promise<CaseDataSummary | null> {
  try {
    const { getAuthUser } = await import('@/lib/auth/session');
    const user = getAuthUser();
    if (!user?.email) return null;

    const caseData = await findUserCaseByEmail(user.email);
    if (!caseData) return null;

    // Get related data
    const [documents, threads] = await Promise.all([
      getApplicationDocuments(caseData.caseId).catch(() => []),
      getMyThreads(1, 10).catch(() => ({ items: [], totalCount: 0 }) as any),
    ]);

    return {
      caseId: caseData.caseId,
      applicationData: caseData,
      documents,
      messages: threads.items || [],
      timeline: [],
    };
  } catch (error) {
    // Don't log 503 or 404 errors - services may not be running or user may not exist yet
    if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
      console.error('Failed to get user case summary:', error);
    }
    return null;
  }
}
