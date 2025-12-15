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

// Disable SSL certificate verification in development
// This is needed because some corporate proxies use self-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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
  type:
    | 'signature'
    | 'text'
    | 'date'
    | 'initials'
    | 'checkbox'
    | 'dropdown'
    | 'radio'
    | 'attachment'
    | 'hyperlink'
    | 'calculation';
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
  radio_group?: string;
  options?: string[];
  validation?: {
    type: 'email' | 'phone' | 'ssn' | 'zip' | 'number' | 'date';
    message?: string;
  };
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

// Premium Features Interfaces

export interface SignNowTemplate {
  id: string;
  name: string;
  document_name: string;
  page_count: number;
  created: number;
  updated: number;
  owner?: string;
  fields?: SignNowField[];
}

export interface SignNowWebhook {
  id?: string;
  event:
    | 'document.create'
    | 'document.complete'
    | 'document.decline'
    | 'document.delete'
    | 'document.update'
    | 'invite.create'
    | 'invite.complete'
    | 'invite.decline'
    | 'field.invite.create'
    | 'field.invite.complete'
    | 'field.invite.decline';
  callback_url: string;
  callback_key?: string;
  use_tls_12?: boolean;
}

export interface SignNowWebhookEvent {
  event: string;
  document_id: string;
  document_name: string;
  timestamp: number;
  user_id?: string;
  invite_id?: string;
  status?: string;
  data?: Record<string, unknown>;
}

export interface SignNowDocumentHistory {
  id: string;
  document_id: string;
  action: string;
  user_id?: string;
  user_email?: string;
  timestamp: number;
  ip_address?: string;
  details?: Record<string, unknown>;
}

export interface SignNowDocumentMerge {
  name: string;
  document_ids: string[];
}

export interface SignNowBulkInvite {
  document_id: string;
  invites: SignNowInvite[];
  from: string;
  subject?: string;
  message?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SignNowBrand {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  email_template?: string;
}

export interface SignNowDocumentAnalytics {
  document_id: string;
  views: number;
  time_spent: number;
  completion_rate: number;
  average_completion_time: number;
  signers: Array<{
    email: string;
    signed_at?: number;
    time_to_sign: number;
  }>;
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
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body:
          'grant_type=password&username=' +
          encodeURIComponent(process.env.SIGNNOW_USERNAME || '') +
          '&password=' +
          encodeURIComponent(process.env.SIGNNOW_PASSWORD || ''),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get access token: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const tokenData: SignNowAccessToken = await response.json();

      // Cache the token
      accessTokenCache = {
        token: tokenData.access_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000 - 60000, // Subtract 1 minute for safety
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${SIGNNOW_API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
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
   * @param file - File buffer, Uint8Array, or base64 encoded string
   * @param fileName - Name of the document
   */
  async uploadDocument(
    file: Buffer | Uint8Array | string,
    fileName: string
  ): Promise<SignNowDocument> {
    const token = await this.getAccessToken();
    const url = `${SIGNNOW_API_BASE_URL}/document`;

    // Convert file to Buffer
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else if (file instanceof Uint8Array) {
      fileBuffer = Buffer.from(file);
    } else {
      // Remove data URL prefix if present
      const base64Data = file.includes(',') ? file.split(',')[1] : file;
      fileBuffer = Buffer.from(base64Data, 'base64');
    }

    // Create multipart form data manually to avoid Blob compatibility issues in Node.js
    const boundary = `----FormBoundary${Date.now().toString(16)}`;

    const parts: Buffer[] = [];

    // Add the file part
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
          `Content-Type: application/pdf\r\n\r\n`
      )
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from('\r\n'));

    // Add closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    // Combine all parts
    const formBody = Buffer.concat(parts);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload document: ${response.status} ${response.statusText}. ${errorText}`
      );
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
   * SignNow API uses PUT /document/{id} with fields in the body
   */
  async addFields(documentId: string, fields: SignNowField[]): Promise<void> {
    await this.request(`/document/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  /**
   * Send document for signing (freeform invite)
   * For freeform invites, only 'to' and 'from' are required
   */
  async sendInvite(
    documentId: string,
    inviteData: SignNowDocumentInvite | { to: string; from: string }
  ): Promise<SignNowDocumentInviteResponse | { result: string; id: string }> {
    return this.request<SignNowDocumentInviteResponse | { result: string; id: string }>(
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
    return this.request<SignNowDownloadResponse>(`/document/${documentId}/download/link`);
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

  // ==================== PREMIUM FEATURES ====================

  /**
   * Create a document template from an existing document
   */
  async createTemplate(
    documentId: string,
    templateName: string
  ): Promise<SignNowTemplate> {
    return this.request<SignNowTemplate>(`/document/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        document_name: templateName,
        template: true,
      }),
    });
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<SignNowTemplate[]> {
    return this.request<SignNowTemplate[]>('/template');
  }

  /**
   * Get template details
   */
  async getTemplate(templateId: string): Promise<SignNowTemplate> {
    return this.request<SignNowTemplate>(`/template/${templateId}`);
  }

  /**
   * Create a document from a template
   */
  async createDocumentFromTemplate(
    templateId: string,
    documentName: string,
    fieldValues?: Record<string, string>
  ): Promise<SignNowDocument> {
    return this.request<SignNowDocument>(`/template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify({
        document_name: documentName,
        field_values: fieldValues,
      }),
    });
  }

  /**
   * Register a webhook
   */
  async registerWebhook(webhook: SignNowWebhook): Promise<SignNowWebhook> {
    return this.request<SignNowWebhook>('/webhook', {
      method: 'POST',
      body: JSON.stringify(webhook),
    });
  }

  /**
   * List all registered webhooks
   */
  async listWebhooks(): Promise<SignNowWebhook[]> {
    return this.request<SignNowWebhook[]>('/webhook');
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/webhook/${webhookId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get document history/audit trail
   */
  async getDocumentHistory(documentId: string): Promise<SignNowDocumentHistory[]> {
    return this.request<SignNowDocumentHistory[]>(`/document/${documentId}/history`);
  }

  /**
   * Merge multiple documents into one
   */
  async mergeDocuments(mergeData: SignNowDocumentMerge): Promise<SignNowDocument> {
    return this.request<SignNowDocument>('/document/merge', {
      method: 'POST',
      body: JSON.stringify(mergeData),
    });
  }

  /**
   * Send bulk invites to multiple documents
   */
  async sendBulkInvites(
    bulkInvites: SignNowBulkInvite[]
  ): Promise<Array<SignNowDocumentInviteResponse>> {
    const results = await Promise.all(
      bulkInvites.map((invite) => this.sendInvite(invite.document_id, invite))
    );
    return results as Array<SignNowDocumentInviteResponse>;
  }

  /**
   * Get document analytics
   */
  async getDocumentAnalytics(documentId: string): Promise<SignNowDocumentAnalytics> {
    // Note: This is a custom implementation that aggregates data
    // SignNow may have a dedicated analytics endpoint
    const document = await this.getDocument(documentId);
    const history = await this.getDocumentHistory(documentId);

    const views = history.filter((h) => h.action === 'view').length;
    const signers = document.field_invites || [];
    const completedSigners = signers.filter((s) => s.status === 'completed');

    return {
      document_id: documentId,
      views,
      time_spent: 0, // Calculate from history timestamps
      completion_rate: signers.length > 0 ? completedSigners.length / signers.length : 0,
      average_completion_time: 0, // Calculate from history
      signers: signers.map((s) => ({
        email: s.email,
        time_to_sign: 0,
      })),
    };
  }

  /**
   * List all brands (custom branding)
   */
  async listBrands(): Promise<SignNowBrand[]> {
    return this.request<SignNowBrand[]>('/brand');
  }

  /**
   * Get brand details
   */
  async getBrand(brandId: string): Promise<SignNowBrand> {
    return this.request<SignNowBrand>(`/brand/${brandId}`);
  }

  /**
   * Create or update a brand
   */
  async createBrand(brand: Omit<SignNowBrand, 'id'>): Promise<SignNowBrand> {
    return this.request<SignNowBrand>('/brand', {
      method: 'POST',
      body: JSON.stringify(brand),
    });
  }

  /**
   * Update document with custom branding
   */
  async applyBrandToDocument(documentId: string, brandId: string): Promise<void> {
    await this.request(`/document/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        brand_id: brandId,
      }),
    });
  }

  /**
   * Get document with all details including fields and invites
   */
  async getDocumentWithDetails(documentId: string): Promise<
    SignNowDocumentStatus & {
      fields?: SignNowField[];
      history?: SignNowDocumentHistory[];
      analytics?: SignNowDocumentAnalytics;
    }
  > {
    const [document, history] = await Promise.all([
      this.getDocument(documentId),
      this.getDocumentHistory(documentId).catch(() => []),
    ]);

    return {
      ...document,
      history,
    };
  }

  /**
   * Duplicate a document
   */
  async duplicateDocument(
    documentId: string,
    newName?: string
  ): Promise<SignNowDocument> {
    const document = await this.getDocument(documentId);
    const downloadBuffer = await this.downloadDocument(documentId);

    // Upload the downloaded buffer as a new document
    const newDocument = await this.uploadDocument(
      downloadBuffer,
      newName || `${document.document_name} (Copy)`
    );

    return newDocument;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.request(`/document/${documentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update document name
   */
  async updateDocumentName(
    documentId: string,
    newName: string
  ): Promise<SignNowDocument> {
    return this.request<SignNowDocument>(`/document/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        document_name: newName,
      }),
    });
  }

  /**
   * Get all documents for the authenticated user
   */
  async listDocuments(params?: {
    per_page?: number;
    page?: number;
    filter?: string;
  }): Promise<{
    data: SignNowDocument[];
    total: number;
    page: number;
    per_page: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.filter) queryParams.append('filter', params.filter);

    const query = queryParams.toString();
    return this.request<{
      data: SignNowDocument[];
      total: number;
      page: number;
      per_page: number;
    }>(`/document${query ? `?${query}` : ''}`);
  }
}

// Export singleton instance
export const signNowApiService = new SignNowApiService();
