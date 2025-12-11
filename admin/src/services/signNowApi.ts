/**
 * SignNow API Service
 * Client for SignNow digital signature API integration
 * 
 * Official Documentation: https://docs.signnow.com/docs/signnow/welcome
 * 
 * Authentication Flow:
 * 1. Use Basic Authorization Token (base64 encoded Client ID:Client Secret) or Client ID/Secret
 * 2. Request OAuth 2.0 access token from /oauth2/token endpoint
 * 3. Use Bearer token for all API requests
 * 4. Access tokens are valid for 30 days and automatically refreshed
 */

// SignNow API base URL
const SIGNNOW_API_BASE_URL = 'https://api.signnow.com';

// Get SignNow credentials from environment
const getSignNowCredentials = () => {
  if (typeof window !== 'undefined') {
    // Client-side: credentials should not be exposed
    throw new Error('SignNow API calls must be made server-side');
  }

  const clientId = process.env.SIGNNOW_CLIENT_ID;
  const clientSecret = process.env.SIGNNOW_CLIENT_SECRET;
  const basicAuthToken = process.env.SIGNNOW_BASIC_AUTH_TOKEN;

  if (!basicAuthToken && (!clientId || !clientSecret)) {
    throw new Error(
      'SignNow credentials not configured. Please set SIGNNOW_BASIC_AUTH_TOKEN or SIGNNOW_CLIENT_ID and SIGNNOW_CLIENT_SECRET'
    );
  }

  return {
    clientId,
    clientSecret,
    basicAuthToken,
  };
};

// Token cache to avoid unnecessary token refreshes
let accessTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

export interface SignNowAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface SignNowDocument {
  id: string;
  document_name: string;
  page_count: number;
  created: number;
  updated: number;
  origin_document_id?: string;
  owner?: string;
  template_id?: string;
}

export interface SignNowField {
  id?: string;
  type: 'signature' | 'text' | 'date' | 'initials' | 'checkbox' | 'dropdown';
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  role?: string;
  label?: string;
  name?: string;
  placeholder?: string;
}

export interface SignNowInvite {
  to: string;
  role_id?: string;
  order?: number;
  subject?: string;
  message?: string;
}

export interface SignNowInviteResponse {
  id: string;
  email: string;
  status: string;
  created: number;
}

export interface SignNowDocumentInvite {
  document_id: string;
  invites: SignNowInvite[];
  from?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message?: string;
}

export interface SignNowDocumentInviteResponse {
  id: string;
  invites: SignNowInviteResponse[];
}

export interface SignNowDocumentStatus {
  id: string;
  document_name: string;
  page_count: number;
  created: number;
  updated: number;
  origin_document_id?: string;
  owner?: string;
  template_id?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'declined';
  field_invites?: Array<{
    id: string;
    email: string;
    role_id?: string;
    status: string;
  }>;
}

export interface SignNowDownloadResponse {
  url: string;
  expires_in: number;
}

class SignNowApiService {
  /**
   * Get or refresh access token
   * Access tokens are valid for 30 days
   */
  private async getAccessToken(): Promise<string> {
    // Check cache first
    if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60000) {
      // Return cached token if it has at least 1 minute left
      return accessTokenCache.token;
    }

    const credentials = getSignNowCredentials();
    const authHeader = credentials.basicAuthToken
      ? `Basic ${credentials.basicAuthToken}`
      : `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`;

    try {
      const response = await fetch(`${SIGNNOW_API_BASE_URL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=password&username=' + encodeURIComponent(process.env.SIGNNOW_USERNAME || '') +
              '&password=' + encodeURIComponent(process.env.SIGNNOW_PASSWORD || ''),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const tokenData: SignNowAccessToken = await response.json();
      
      // Cache the token
      accessTokenCache = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000) - 60000, // Subtract 1 minute for safety
      };

      return tokenData.access_token;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to authenticate with SignNow API');
    }
  }

  /**
   * Make authenticated request to SignNow API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${SIGNNOW_API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `SignNow API request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = `${errorMessage}: ${errorText}`;
          }
        }

        throw new Error(errorMessage);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Upload a document to SignNow
   * @param file - File buffer or base64 encoded string
   * @param fileName - Name of the document
   */
  async uploadDocument(
    file: Buffer | string,
    fileName: string
  ): Promise<SignNowDocument> {
    const token = await this.getAccessToken();
    const url = `${SIGNNOW_API_BASE_URL}/document`;

    // Convert file to Buffer if it's a base64 string
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      // Remove data URL prefix if present
      const base64Data = file.includes(',') ? file.split(',')[1] : file;
      fileBuffer = Buffer.from(base64Data, 'base64');
    }

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    // Create a File-like object from Buffer
    // In Node.js 18+, FormData accepts File, Blob, or Buffer
    const fileBlob = typeof Blob !== 'undefined' 
      ? new Blob([fileBuffer], { type: 'application/pdf' })
      : fileBuffer;
    formData.append('file', fileBlob as unknown as File, fileName);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let fetch set it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload document: ${response.status} ${response.statusText}. ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get document details
   */
  async getDocument(documentId: string): Promise<SignNowDocumentStatus> {
    return this.request<SignNowDocumentStatus>(`/document/${documentId}`);
  }

  /**
   * Add signature fields to a document
   */
  async addFields(
    documentId: string,
    fields: SignNowField[]
  ): Promise<void> {
    await this.request(`/document/${documentId}/field`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
  }

  /**
   * Send document for signing
   */
  async sendInvite(
    documentId: string,
    inviteData: SignNowDocumentInvite
  ): Promise<SignNowDocumentInviteResponse> {
    return this.request<SignNowDocumentInviteResponse>(
      `/document/${documentId}/invite`,
      {
        method: 'POST',
        body: JSON.stringify(inviteData),
      }
    );
  }

  /**
   * Get download link for completed document
   */
  async getDownloadLink(documentId: string): Promise<SignNowDownloadResponse> {
    return this.request<SignNowDownloadResponse>(
      `/document/${documentId}/download/link`
    );
  }

  /**
   * Download completed document
   */
  async downloadDocument(documentId: string): Promise<Buffer> {
    const downloadLink = await this.getDownloadLink(documentId);
    
    const response = await fetch(downloadLink.url);
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Cancel a document invite
   */
  async cancelInvite(documentId: string, inviteId: string): Promise<void> {
    await this.request(`/document/${documentId}/fieldinvitecancel/${inviteId}`, {
      method: 'PUT',
    });
  }

  /**
   * Create an embedded signing link
   */
  async createEmbeddedLink(
    documentId: string,
    email: string,
    roleId?: string
  ): Promise<{ link: string }> {
    const response = await this.request<{ link: string }>(
      `/document/${documentId}/embeddedinvite`,
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          role_id: roleId,
        }),
      }
    );
    return response;
  }
}

// Export singleton instance
export const signNowApiService = new SignNowApiService();

