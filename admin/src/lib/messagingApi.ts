// Messaging API service for connecting to backend messaging service via Next.js proxy

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'; // Use relative path in browser, absolute in SSR
const MESSAGING_PREFIX = '/api/proxy/messaging';

// Generate a deterministic GUID from email (matching backend's approach)
// Uses a simple hash-based approach that produces consistent GUIDs
function generateGuidFromEmailSync(email: string, namespaceGuid: string): string {
  const emailLower = email.toLowerCase();
  // Simple hash-based approach for immediate use
  let hash = 0;
  for (let i = 0; i < emailLower.length; i++) {
    const char = emailLower.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  // Format as GUID
  return `${hashStr.substring(0, 8)}-${hashStr.substring(0, 4)}-5000-8000-${hashStr.padEnd(12, '0')}`;
}

function parseGuidToBytes(guid: string): Uint8Array {
  const cleaned = guid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToGuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

// Backend DTO types
export type MessageDto = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId?: string | null;
  receiverName?: string | null;
  content: string;
  type?: string;
  status: string;
  sentAt: string;
  readAt?: string | null;
  isRead: boolean;
  replyToMessageId?: string | null;
  attachments?: MessageAttachmentDto[];
  isStarred?: boolean;
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
      if (session?.user?.role || session?.user?.roles) {
        const role = session.user.role || session.user.roles?.[0] || 'Admin';
        headers['X-User-Role'] = role;
      }
    } catch (error) {
      console.warn('Failed to get session:', error);
    }
  }

  return headers;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Use Next.js API proxy to avoid CORS issues and handle authentication
  const url = `${API_BASE}${MESSAGING_PREFIX}${endpoint}`;
  const headers = await getAuthHeaders();
  
  // Log request for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Messaging API] ${options?.method || 'GET'} ${url}`);
  }
  
  // Add user identification headers for backend services
  // These will be forwarded by the proxy to the backend
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user?.email) {
        (headers as any)['X-User-Email'] = session.user.email;
      }
      if (session?.user?.name) {
        (headers as any)['X-User-Name'] = session.user.name;
      }
      if (session?.user?.role || session?.user?.roles) {
        const role = session.user.role || session.user.roles?.[0] || 'Administrator';
        (headers as any)['X-User-Role'] = role;
        // Generate a consistent GUID from email (matching backend's UUID v5 algorithm)
        if (session?.user?.email) {
          const email = session.user.email;
          // Use the same namespace GUID as the backend (DNS namespace)
          const namespaceGuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
          // Generate GUID synchronously for immediate use
          const guid = generateGuidFromEmailSync(email, namespaceGuid);
          (headers as any)['X-User-Id'] = guid;
        }
      }
    } catch (error) {
      console.warn('Failed to get session for user headers:', error);
      // Fallback to development headers
      if (process.env.NODE_ENV === 'development') {
        const namespaceGuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
        const adminGuid = generateGuidFromEmailSync('admin@mukuru.com', namespaceGuid);
        (headers as any)['X-User-Id'] = adminGuid;
        (headers as any)['X-User-Email'] = 'admin@mukuru.com';
        (headers as any)['X-User-Name'] = 'Admin User';
        (headers as any)['X-User-Role'] = 'Administrator';
      }
    }
  } else {
    // Server-side: use development headers
    if (process.env.NODE_ENV === 'development') {
      const namespaceGuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const adminGuid = generateGuidFromEmailSync('admin@mukuru.com', namespaceGuid);
      (headers as any)['X-User-Id'] = adminGuid;
      (headers as any)['X-User-Email'] = 'admin@mukuru.com';
      (headers as any)['X-User-Name'] = 'Admin User';
      (headers as any)['X-User-Role'] = 'Administrator';
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

      // Log response for debugging (in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Messaging API] Response: ${response.status} ${response.statusText}`);
      }

      // Get response text for debugging before parsing (can only read once)
      const responseText = await response.text();
      
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
          errorMessage = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
        }
      }
      
      // Provide helpful error message for service unavailable
      if (response.status === 503) {
        errorMessage = 'Backend messaging service is unavailable. Please ensure the messaging service is running.';
      }
      
      throw new Error(errorMessage);
    }
      
      if (process.env.NODE_ENV === 'development' && endpoint.includes('threads/my')) {
        console.log(`[Messaging API] Response body (first 500 chars):`, responseText.substring(0, 500));
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
            const data = parsed as any;
            console.log('[Messaging API] Parsed response (full):', JSON.stringify(data, null, 2));
            console.log('[Messaging API] Parsed response (summary):', {
              totalCount: data.totalCount || data.TotalCount || 0,
              itemsCount: (data.items || data.Items || []).length,
              page: data.page || data.Page || 0,
              pageSize: data.pageSize || data.PageSize || 0,
              hasItems: !!(data.items || data.Items),
              itemsPreview: (data.items || data.Items || []).slice(0, 2)
            });
          }
          return parsed;
        } catch (parseError) {
          console.error('[Messaging API] JSON parse error:', parseError, 'Response text:', text);
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
      throw new Error(`Cannot connect to Messaging API. Please ensure the backend services are running.`);
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
      pageSize: String(pageSize) 
    }).toString();
    const result = await request<any>(`/api/v1/messages/threads/my?${qs}`);
    
    // Normalize response - handle both camelCase and PascalCase from backend
    return {
      items: result.items || result.Items || [],
      totalCount: result.totalCount ?? result.TotalCount ?? 0,
      page: result.page ?? result.Page ?? page,
      pageSize: result.pageSize ?? result.PageSize ?? pageSize,
      totalPages: result.totalPages ?? result.TotalPages ?? 0,
      hasNextPage: result.hasNextPage ?? result.HasNextPage ?? false,
      hasPreviousPage: result.hasPreviousPage ?? result.HasPreviousPage ?? false
    } as PagedResult<MessageThreadDto>;
  },

  /**
   * Get all message threads (admin only)
   */
  async getAllThreads(page = 1, pageSize = 20): Promise<PagedResult<MessageThreadDto>> {
    const qs = new URLSearchParams({ 
      page: String(page), 
      pageSize: String(pageSize) 
    }).toString();
    const result = await request<any>(`/api/v1/messages/threads/all?${qs}`);
    
    // Normalize response - handle both camelCase and PascalCase from backend
    return {
      items: result.items || result.Items || [],
      totalCount: result.totalCount ?? result.TotalCount ?? 0,
      page: result.page ?? result.Page ?? page,
      pageSize: result.pageSize ?? result.PageSize ?? pageSize,
      totalPages: result.totalPages ?? result.TotalPages ?? 0,
      hasNextPage: result.hasNextPage ?? result.HasNextPage ?? false,
      hasPreviousPage: result.hasPreviousPage ?? result.HasPreviousPage ?? false
    } as PagedResult<MessageThreadDto>;
  },

  /**
   * Get message thread by application ID
   */
  async getThreadByApplication(applicationId: string): Promise<MessageThreadDto> {
    return request<MessageThreadDto>(`/api/v1/messages/threads/application/${encodeURIComponent(applicationId)}`);
  },

  /**
   * Get messages in a thread
   */
  async getThreadMessages(threadId: string, page = 1, pageSize = 50): Promise<PagedResult<MessageDto>> {
    const qs = new URLSearchParams({ 
      page: String(page), 
      pageSize: String(pageSize) 
    }).toString();
    return request<PagedResult<MessageDto>>(`/api/v1/messages/threads/${encodeURIComponent(threadId)}/messages?${qs}`);
  },

  /**
   * Send a message
   */
  async sendMessage(
    applicationId: string, 
    content: string, 
    receiverId?: string,
    replyToMessageId?: string,
    attachments?: Array<{ fileName: string; contentType: string; fileSizeBytes: number; storageKey: string; storageUrl: string; documentId?: string; description?: string }>
  ): Promise<{ success: boolean; messageId?: string; threadId?: string; errorMessage?: string }> {
    try {
      // Check if applicationId is a GUID or a case ID (case number)
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let applicationGuid = applicationId;
      
      // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
      if (!guidRegex.test(applicationId)) {
        try {
          // Use the applications API to fetch case data
          const { applicationsApi } = await import('./applicationsApi');
          const caseData = await applicationsApi.getApplicationById(applicationId);
          
          if (caseData?.id) {
            applicationGuid = caseData.id;
          } else {
            throw new Error(`Could not find application GUID for case ID: ${applicationId}`);
          }
        } catch (error) {
          console.error('Failed to fetch application GUID from case ID:', error);
          throw new Error(`Invalid application ID: ${applicationId}. Could not resolve to GUID.`);
        }
      }

      const requestBody: any = {
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
        requestBody.Attachments = attachments.map(a => ({
          FileName: a.fileName,
          ContentType: a.contentType,
          FileSizeBytes: a.fileSizeBytes,
          StorageKey: a.storageKey,
          StorageUrl: a.storageUrl,
          DocumentId: a.documentId,
          Description: a.description
        }));
      }

      const response = await request<{ 
        Success?: boolean; 
        success?: boolean;
        MessageId?: string; 
        messageId?: string;
        ThreadId?: string; 
        threadId?: string;
        ErrorMessage?: string;
        errorMessage?: string;
      }>(`/api/v1/messages`, {
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
    } catch (error) {
      // If endpoint doesn't exist, calculate from threads
      const threads = await this.getMyThreads(1, 1000);
      const totalUnread = threads.items.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
      return { count: totalUnread };
    }
  },

  /**
   * Mark message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    await request(`/api/v1/messages/${encodeURIComponent(messageId)}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      await request(`/api/v1/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        errorMessage: error instanceof Error ? error.message : 'Failed to delete message' 
      };
    }
  },

  /**
   * Star or unstar a message
   */
  async starMessage(messageId: string): Promise<{ success: boolean; isStarred: boolean; errorMessage?: string }> {
    try {
      const response = await request<{ Success?: boolean; IsStarred?: boolean; success?: boolean; isStarred?: boolean; ErrorMessage?: string }>(`/api/v1/messages/${encodeURIComponent(messageId)}/star`, {
        method: 'PUT',
      });
      return {
        success: response.Success ?? response.success ?? false,
        isStarred: response.IsStarred ?? response.isStarred ?? false,
        errorMessage: response.ErrorMessage
      };
    } catch (error) {
      return {
        success: false,
        isStarred: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to star message'
      };
    }
  },

  /**
   * Archive or unarchive a thread
   */
  async archiveThread(threadId: string, archive: boolean = true): Promise<{ success: boolean; isArchived: boolean; errorMessage?: string }> {
    try {
      const response = await request<{ Success?: boolean; IsArchived?: boolean; success?: boolean; isArchived?: boolean; ErrorMessage?: string }>(`/api/v1/messages/threads/${encodeURIComponent(threadId)}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ Archive: archive })
      });
      return {
        success: response.Success ?? response.success ?? false,
        isArchived: response.IsArchived ?? response.isArchived ?? false,
        errorMessage: response.ErrorMessage
      };
    } catch (error) {
      return {
        success: false,
        isArchived: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to archive thread'
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
  ): Promise<{ success: boolean; newMessageId?: string; newThreadId?: string; errorMessage?: string }> {
    try {
      const response = await request<{ 
        Success?: boolean; 
        NewMessageId?: string; 
        NewThreadId?: string;
        success?: boolean;
        newMessageId?: string;
        newThreadId?: string;
        ErrorMessage?: string;
      }>(`/api/v1/messages/${encodeURIComponent(messageId)}/forward`, {
        method: 'POST',
        body: JSON.stringify({
          ToApplicationId: toApplicationId,
          ToReceiverId: toReceiverId,
          AdditionalContent: additionalContent
        })
      });
      return {
        success: response.Success ?? response.success ?? false,
        newMessageId: response.NewMessageId ?? response.newMessageId,
        newThreadId: response.NewThreadId ?? response.newThreadId,
        errorMessage: response.ErrorMessage
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to forward message'
      };
    }
  },
};

export default messagingApi;
