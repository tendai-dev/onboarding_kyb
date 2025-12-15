/* eslint-disable security/detect-object-injection */
// Messaging API service for connecting to backend messaging service via Next.js proxy

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'; // Use relative path in browser, absolute in SSR
const MESSAGING_PREFIX = '/api/proxy/messaging';

// MD5 implementation (matches .NET's MD5.Create().ComputeHash())
// This is used to generate deterministic GUIDs from email addresses
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

  function f(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    ac: number
  ): number {
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
  let a = 0x67452301,
    b = 0xefcdab89,
    c = 0x98badcfe,
    d = 0x10325476;

  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  const S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  const S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a,
      BB = b,
      CC = c,
      DD = d;

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

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < hex.length && i < 32; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Generate a deterministic GUID from email (matching backend's MD5-based approach)
// Backend uses MD5 hash with RFC 4122 version 5 bit manipulation
// This matches the backend implementation in MessagesController.GetCurrentUserId()
export function generateGuidFromEmailSync(email: string, _namespaceGuid: string): string {
  if (!email) return '';

  const emailLower = email.toLowerCase().trim();

  // Use MD5 hash (same as backend)
  const md5Hash = md5(emailLower);

  // Convert hex string to bytes and apply UUID version 5 bits (same as backend)
  const bytes = hexToBytes(md5Hash);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // Version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Format as UUID
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

export function parseGuidToBytes(guid: string): Uint8Array {
  const cleaned = guid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToGuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// Backend DTO types - supports both camelCase and snake_case from backend
export type MessageDto = {
  id: string;
  threadId: string;
  thread_id?: string; // snake_case from backend
  senderId: string;
  sender_id?: string; // snake_case from backend
  senderName: string;
  sender_name?: string; // snake_case from backend
  senderRole: string;
  sender_role?: string; // snake_case from backend
  receiverId?: string | null;
  receiver_id?: string | null; // snake_case from backend
  receiverName?: string | null;
  receiver_name?: string | null; // snake_case from backend
  content: string;
  type?: string;
  status: string;
  sentAt: string;
  sent_at?: string; // snake_case from backend
  readAt?: string | null;
  read_at?: string | null; // snake_case from backend
  isRead: boolean;
  is_read?: boolean; // snake_case from backend
  replyToMessageId?: string | null;
  reply_to_message_id?: string | null; // snake_case from backend
  attachments?: MessageAttachmentDto[];
  isStarred?: boolean;
  is_starred?: boolean; // snake_case from backend
};

export type MessageAttachmentDto = {
  id: string;
  messageId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageUrl: string;
  documentId?: string | null;
  description?: string | null;
  uploadedAt: string;
};

export type MessageThreadDto = {
  id: string;
  applicationId: string;
  applicationReference?: string;
  applicantId: string;
  applicantName: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  isActive: boolean;
  isArchived?: boolean;
  isStarred?: boolean;
  createdAt: string;
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
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // DO NOT send accessToken - API proxy will inject it from Redis
  // Only add user identification headers for backend
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();

      // Add user identification headers for backend
      if (session?.user?.email) {
        headers['X-User-Email'] = session.user.email;
      }
      if (session?.user?.name) {
        headers['X-User-Name'] = session.user.name;
      }
      // Always set role - default to Admin for admin portal
      const role = session?.user?.role || session?.user?.roles?.[0] || 'Admin';
      headers['X-User-Role'] = role;
    } catch {
      // Fallback to Admin role on error
      headers['X-User-Role'] = 'Admin';
    }
  } else {
    // Server-side: default to Admin
    headers['X-User-Role'] = 'Admin';
  }

  return headers;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Use Next.js API proxy to avoid CORS issues and handle authentication
  const url = `${API_BASE}${MESSAGING_PREFIX}${endpoint}`;
  const headers = await getAuthHeaders();

  // Log request for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Messaging API] ${options?.method || 'GET'} ${url}`);
  }

  // Add user identification headers for backend services
  // These will be forwarded by the proxy to the backend
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user?.email) {
        (headers as Record<string, string>)['X-User-Email'] = session.user.email;
      }
      if (session?.user?.name) {
        (headers as Record<string, string>)['X-User-Name'] = session.user.name;
      }
      if (session?.user?.role || session?.user?.roles) {
        const role = session.user.role || session.user.roles?.[0] || 'Administrator';
        (headers as Record<string, string>)['X-User-Role'] = role;
        // Generate a consistent GUID from email (matching backend's UUID v5 algorithm)
        if (session?.user?.email) {
          const email = session.user.email;
          // Use the same namespace GUID as the backend (DNS namespace)
          const namespaceGuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
          // Generate GUID synchronously for immediate use
          const guid = generateGuidFromEmailSync(email, namespaceGuid);
          (headers as Record<string, string>)['X-User-Id'] = guid;
        }
      }
    } catch {
      // Fallback to development headers
      if (process.env.NODE_ENV === 'development') {
        const namespaceGuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
        const adminGuid = generateGuidFromEmailSync('admin@mukuru.com', namespaceGuid);
        (headers as Record<string, string>)['X-User-Id'] = adminGuid;
        (headers as Record<string, string>)['X-User-Email'] = 'admin@mukuru.com';
        (headers as Record<string, string>)['X-User-Name'] = 'Admin User';
        (headers as Record<string, string>)['X-User-Role'] = 'Administrator';
      }
    }
  } else {
    // Server-side: use development headers
    if (process.env.NODE_ENV === 'development') {
      const namespaceGuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const adminGuid = generateGuidFromEmailSync('admin@mukuru.com', namespaceGuid);
      (headers as Record<string, string>)['X-User-Id'] = adminGuid;
      (headers as Record<string, string>)['X-User-Email'] = 'admin@mukuru.com';
      (headers as Record<string, string>)['X-User-Name'] = 'Admin User';
      (headers as Record<string, string>)['X-User-Role'] = 'Administrator';
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
      credentials: 'include',
    });

    // Get response text for debugging before parsing (can only read once)
    const responseText = await response.text();

    // Log response for debugging (in development) - skip 400 errors for /read endpoint
    if (process.env.NODE_ENV === 'development') {
      const isReadEndpoint = endpoint.includes('/read');
      const is400Error = response.status === 400;
      if (!(isReadEndpoint && is400Error)) {
        console.info(
          `[Messaging API] Response: ${response.status} ${response.statusText}`
        );
      }
    }

    if (!response.ok) {
      let errorMessage = `Messaging API request failed: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.details) {
          errorMessage = errorJson.details;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        if (responseText && responseText.trim().length > 0) {
          errorMessage =
            responseText.length > 200
              ? responseText.substring(0, 200) + '...'
              : responseText;
        }
      }

      // Provide helpful error message for service unavailable
      if (response.status === 503) {
        errorMessage =
          'Backend messaging service is unavailable. Please ensure the messaging service is running.';
      }

      throw new Error(errorMessage);
    }

    if (process.env.NODE_ENV === 'development' && endpoint.includes('threads/my')) {
      console.info(
        `[Messaging API] Response body (first 500 chars):`,
        responseText.substring(0, 500)
      );
    }

    // Handle responses
    const contentType = response.headers.get('content-type');
    const text = responseText; // Use the text we already read

    if (contentType && contentType.includes('application/json')) {
      if (!text || text.trim() === '') {
        console.warn('[Messaging API] Empty response body for:', endpoint);
        return {} as T;
      }
      try {
        const parsed = JSON.parse(text) as T;
        if (process.env.NODE_ENV === 'development' && endpoint.includes('threads/my')) {
          // Check both camelCase and PascalCase
          interface ResponseData {
            totalCount?: number;
            TotalCount?: number;
            items?: unknown[];
            Items?: unknown[];
            page?: number;
            Page?: number;
            pageSize?: number;
            PageSize?: number;
          }
          const data = parsed as ResponseData;
          console.info(
            '[Messaging API] Parsed response (full):',
            JSON.stringify(data, null, 2)
          );
          console.info('[Messaging API] Parsed response (summary):', {
            totalCount: data.totalCount || data.TotalCount || 0,
            itemsCount: (data.items || data.Items || []).length,
            page: data.page || data.Page || 0,
            pageSize: data.pageSize || data.PageSize || 0,
            hasItems: !!(data.items || data.Items),
            itemsPreview: (data.items || data.Items || []).slice(0, 2),
          });
        }
        return parsed;
      } catch (parseError) {
        console.error(
          '[Messaging API] JSON parse error:',
          parseError,
          'Response text:',
          text
        );
        throw new Error('Invalid JSON response from server');
      }
    }

    // For non-JSON responses
    if (text && text.trim().length > 0) {
      console.warn('[Messaging API] Non-JSON response received:', text.substring(0, 200));
    }

    return {} as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        `Cannot connect to Messaging API. Please ensure the backend services are running.`
      );
    }
    throw error;
  }
}

export const messagingApi = {
  /**
   * Get my message threads
   */
  async getMyThreads(page = 1, pageSize = 20): Promise<PagedResult<MessageThreadDto>> {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    }).toString();
    interface BackendResponse {
      items?: MessageThreadDto[];
      Items?: MessageThreadDto[];
      totalCount?: number;
      TotalCount?: number;
      page?: number;
      Page?: number;
      pageSize?: number;
      PageSize?: number;
      totalPages?: number;
      TotalPages?: number;
      hasNextPage?: boolean;
      HasNextPage?: boolean;
      hasPreviousPage?: boolean;
      HasPreviousPage?: boolean;
    }
    const result = await request<BackendResponse>(`/api/v1/messages/threads/my?${qs}`);

    // Normalize response - handle both camelCase and PascalCase from backend
    return {
      items: result.items || result.Items || [],
      totalCount: result.totalCount ?? result.TotalCount ?? 0,
      page: result.page ?? result.Page ?? page,
      pageSize: result.pageSize ?? result.PageSize ?? pageSize,
      totalPages: result.totalPages ?? result.TotalPages ?? 0,
      hasNextPage: result.hasNextPage ?? result.HasNextPage ?? false,
      hasPreviousPage: result.hasPreviousPage ?? result.HasPreviousPage ?? false,
    } as PagedResult<MessageThreadDto>;
  },

  /**
   * Get all message threads (admin only)
   */
  async getAllThreads(page = 1, pageSize = 20): Promise<PagedResult<MessageThreadDto>> {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    }).toString();
    interface BackendResponse {
      items?: MessageThreadDto[];
      Items?: MessageThreadDto[];
      totalCount?: number;
      TotalCount?: number;
      page?: number;
      Page?: number;
      pageSize?: number;
      PageSize?: number;
      totalPages?: number;
      TotalPages?: number;
      hasNextPage?: boolean;
      HasNextPage?: boolean;
      hasPreviousPage?: boolean;
      HasPreviousPage?: boolean;
    }
    const result = await request<BackendResponse>(`/api/v1/messages/threads/all?${qs}`);

    // Normalize response - handle both camelCase and PascalCase from backend
    return {
      items: result.items || result.Items || [],
      totalCount: result.totalCount ?? result.TotalCount ?? 0,
      page: result.page ?? result.Page ?? page,
      pageSize: result.pageSize ?? result.PageSize ?? pageSize,
      totalPages: result.totalPages ?? result.TotalPages ?? 0,
      hasNextPage: result.hasNextPage ?? result.HasNextPage ?? false,
      hasPreviousPage: result.hasPreviousPage ?? result.HasPreviousPage ?? false,
    } as PagedResult<MessageThreadDto>;
  },

  /**
   * Get message thread by application ID
   */
  async getThreadByApplication(applicationId: string): Promise<MessageThreadDto> {
    return request<MessageThreadDto>(
      `/api/v1/messages/threads/application/${encodeURIComponent(applicationId)}`
    );
  },

  /**
   * Get messages in a thread
   */
  async getThreadMessages(
    threadId: string,
    page = 1,
    pageSize = 50
  ): Promise<PagedResult<MessageDto>> {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    }).toString();
    return request<PagedResult<MessageDto>>(
      `/api/v1/messages/threads/${encodeURIComponent(threadId)}/messages?${qs}`
    );
  },

  /**
   * Send a message
   */
  async sendMessage(
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
  ): Promise<{
    success: boolean;
    messageId?: string;
    threadId?: string;
    errorMessage?: string;
  }> {
    try {
      // Check if applicationId is a GUID or a case ID (case number)
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let applicationGuid = applicationId;

      // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
      if (!guidRegex.test(applicationId)) {
        try {
          // Use the applications API to fetch case data
          const { fetchApplicationById } = await import('@/services');
          const caseData = await fetchApplicationById(applicationId);

          if (caseData?.id) {
            applicationGuid = caseData.id;
          } else {
            throw new Error(
              `Could not find application GUID for case ID: ${applicationId}`
            );
          }
        } catch (error) {
          console.error('Failed to fetch application GUID from case ID:', error);
          throw new Error(
            `Invalid application ID: ${applicationId}. Could not resolve to GUID.`
          );
        }
      }

      interface RequestBody {
        ApplicationId: string;
        Content: string;
        ReceiverId?: string;
        ReplyToMessageId?: string;
        Attachments?: Array<{
          FileName: string;
          ContentType: string;
          FileSizeBytes: number;
          StorageKey: string;
          StorageUrl: string;
          DocumentId?: string;
          Description?: string;
        }>;
      }
      const requestBody: RequestBody = {
        ApplicationId: applicationGuid,
        Content: content,
      };

      // Only include ReceiverId if provided
      if (receiverId) {
        requestBody.ReceiverId = receiverId;
      }

      // Include reply-to if provided
      if (replyToMessageId) {
        requestBody.ReplyToMessageId = replyToMessageId;
      }

      // Include attachments if provided
      if (attachments && attachments.length > 0) {
        requestBody.Attachments = attachments.map((a) => ({
          FileName: a.fileName,
          ContentType: a.contentType,
          FileSizeBytes: a.fileSizeBytes,
          StorageKey: a.storageKey,
          StorageUrl: a.storageUrl,
          DocumentId: a.documentId,
          Description: a.description,
        }));
      }

      interface ResponseBody {
        Success?: boolean;
        success?: boolean;
        MessageId?: string;
        messageId?: string;
        ThreadId?: string;
        threadId?: string;
        ErrorMessage?: string;
        errorMessage?: string;
      }
      const response = await request<ResponseBody>(`/api/v1/messages`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Map backend response format (handles both PascalCase and camelCase)
      const success = response.Success ?? response.success ?? false;
      const messageId = response.MessageId ?? response.messageId;
      const threadId = response.ThreadId ?? response.threadId;
      const errorMessage = response.ErrorMessage ?? response.errorMessage;

      if (!success && errorMessage) {
        throw new Error(errorMessage);
      }

      return {
        success,
        messageId,
        threadId,
        errorMessage,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      return await request<{ count: number }>(`/api/v1/messages/unread/count`);
    } catch {
      // If endpoint doesn't exist, calculate from threads
      const threads = await this.getMyThreads(1, 1000);
      const totalUnread = threads.items.reduce(
        (sum, thread) => sum + (thread.unreadCount || 0),
        0
      );
      return { count: totalUnread };
    }
  },

  /**
   * Mark message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    try {
      await request(`/api/v1/messages/${encodeURIComponent(messageId)}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      // Silently handle 400 errors - backend may reject for various reasons (already read, invalid state, etc.)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        // Don't log or throw - this is expected in some cases
        return;
      }
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(
    messageId: string
  ): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      await request(`/api/v1/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete message',
      };
    }
  },

  /**
   * Star or unstar a message
   */
  async starMessage(
    messageId: string
  ): Promise<{ success: boolean; isStarred: boolean; errorMessage?: string }> {
    try {
      interface ResponseBody {
        Success?: boolean;
        IsStarred?: boolean;
        success?: boolean;
        isStarred?: boolean;
        ErrorMessage?: string;
      }
      const response = await request<ResponseBody>(
        `/api/v1/messages/${encodeURIComponent(messageId)}/star`,
        {
          method: 'PUT',
        }
      );
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
  },

  /**
   * Archive or unarchive a thread
   */
  async archiveThread(
    threadId: string,
    archive: boolean = true
  ): Promise<{ success: boolean; isArchived: boolean; errorMessage?: string }> {
    try {
      interface ResponseBody {
        Success?: boolean;
        IsArchived?: boolean;
        success?: boolean;
        isArchived?: boolean;
        ErrorMessage?: string;
      }
      const response = await request<ResponseBody>(
        `/api/v1/messages/threads/${encodeURIComponent(threadId)}/archive`,
        {
          method: 'PUT',
          body: JSON.stringify({ Archive: archive }),
        }
      );
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
  },

  /**
   * Forward a message
   */
  async forwardMessage(
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
      interface ResponseBody {
        Success?: boolean;
        NewMessageId?: string;
        NewThreadId?: string;
        success?: boolean;
        newMessageId?: string;
        newThreadId?: string;
        ErrorMessage?: string;
      }
      const response = await request<ResponseBody>(
        `/api/v1/messages/${encodeURIComponent(messageId)}/forward`,
        {
          method: 'POST',
          body: JSON.stringify({
            ToApplicationId: toApplicationId,
            ToReceiverId: toReceiverId,
            AdditionalContent: additionalContent,
          }),
        }
      );
      return {
        success: response.Success ?? response.success ?? false,
        newMessageId: response.NewMessageId ?? response.newMessageId,
        newThreadId: response.NewThreadId ?? response.newThreadId,
        errorMessage: response.ErrorMessage,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to forward message',
      };
    }
  },
};

export default messagingApi;
