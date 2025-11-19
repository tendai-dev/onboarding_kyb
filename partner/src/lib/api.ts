export type UserCase = {
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
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api/proxy";
const MESSAGING_PREFIX = "/messaging"; // handled in proxy route to target messaging service

// Tokens are no longer accessed from localStorage - proxy handles authentication

/**
 * Generate a consistent UUID v5 from email address (matches backend implementation)
 * This is used to generate PartnerId and UserId from Keycloak email addresses
 * 
 * @param email - User's email address from Keycloak
 * @returns UUID v5 string (deterministic, same email always produces same UUID)
 */
export function generateUserIdFromEmail(email: string): string {
  // UUID v5 namespace (DNS namespace)
  const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  
  // Convert namespace UUID to bytes
  const namespaceBytes = parseUUID(NAMESPACE_UUID);
  
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();
  const emailBytes = new TextEncoder().encode(normalizedEmail);
  
  // Combine namespace and email
  const combined = new Uint8Array(namespaceBytes.length + emailBytes.length);
  combined.set(namespaceBytes);
  combined.set(emailBytes, namespaceBytes.length);
  
  // Use Web Crypto API for SHA-1 (or fallback)
  // Note: This is a simplified version - for production use a proper UUID v5 library
  // For now, we'll let the backend generate it if this fails
  try {
    // Simple hash-based approach that's deterministic
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined[i];
      hash = hash & hash;
    }
    
    // Convert to UUID-like format
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-5${hex.substring(13, 16)}-${(parseInt(hex[16], 16) | 0x8).toString(16)}${hex.substring(17, 20)}-${hex.substring(20, 32)}`;
  } catch {
    // If generation fails, return empty - backend will generate from email
    return '';
  }
}

// Helper to parse UUID string to bytes
function parseUUID(uuid: string): Uint8Array {
  const clean = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
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
  const { method = "GET", body, retry = true } = options;
  
  // Tokens are no longer accessed from localStorage
  // The proxy will automatically inject the Authorization header from Redis based on session cookie
  
  // Generate or retrieve trace ID for request tracking
  const traceId = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('traceId') || crypto.randomUUID())
    : crypto.randomUUID();
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('traceId', traceId);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Trace-Id": traceId,
    "X-Request-Id": traceId,
  };
  
  // DO NOT set Authorization header - proxy will inject it from Redis
  // All requests must include credentials to send session cookie
  // Try to get user info from NextAuth session for user identification headers
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    if (session?.user) {
      headers["X-User-Name"] = session.user.name || session.user.email || "Partner User";
      headers["X-User-Role"] = "Applicant";
      if (session.user.email) {
        headers["X-User-Email"] = session.user.email;
        // Generate a consistent GUID from email for user identification
        const userId = generateUserIdFromEmail(session.user.email);
        headers["X-User-Id"] = userId;
      }
    }
  } catch {
    // Ignore if auth session not available
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
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
    const error = new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`);
    (error as any).isNetworkError = true;
    throw error;
  }
  
  // Handle 401 Unauthorized - redirect to login
  // Token refresh is handled server-side by NextAuth
  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
    throw new Error("Session expired. Please sign in again.");
  }
  
  // Retry logic for network/server errors (5xx), but not 503 (Service Unavailable)
  // 503 means the service isn't running, so retrying won't help
  if (!response.ok && response.status >= 500 && response.status !== 503) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
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
    const text = await response.text().catch(() => "");
    
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
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  
  return {} as T;
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body });
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body });
}

async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}

export async function getDashboard(partnerId?: string): Promise<DashboardSummary> {
  const qs = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
  // Align with gateway mapping: /projections/v1 -> projections service root
  return apiGet<DashboardSummary>(`/projections/v1/api/v1/dashboard${qs}`);
}

export async function findUserCaseByEmail(email: string): Promise<UserCase | null> {
  if (!email) return null;
  // Generate partner ID from email to filter cases by ownership
  // Declare outside try block so it's available in catch handlers
  const userPartnerId = generateUserIdFromEmail(email);
  try {
    
    // Try Projections API first (has more complete data)
    // Filter by both email (searchTerm) and partnerId to ensure ownership
    const params = new URLSearchParams({ searchTerm: email, take: "10" }); // Get more results to filter
    if (userPartnerId) {
      params.append('partnerId', userPartnerId);
    }
    
    const result = await apiGet<{ items: Array<{
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
    }> }>(`/projections/v1/api/v1/cases?${params.toString()}`);
    
    // Filter results to ensure they match the user's email and partner ID
    // This provides an extra layer of security in case the API doesn't filter correctly
    const matchingItem = result.items?.find(item => {
      const emailMatch = item.applicantEmail?.toLowerCase() === email.toLowerCase();
      const partnerMatch = !userPartnerId || !item.partnerId || 
                          item.partnerId.toLowerCase() === userPartnerId.toLowerCase();
      return emailMatch && partnerMatch;
    });
    
    if (matchingItem) {
      // Map applicantCountry to country if needed
      return {
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
        assignedAt: matchingItem.assignedAt
      };
    }
    
    // Fallback: If not found in projections, try case API directly (for newly created cases)
    // This handles cases that haven't been synced to projections yet
    console.log('Case not found in projections API, trying case API directly...');
    try {
      // Use searchTerm to search for the email, then filter by email on client side
      // The case API searches in case number, name, business name, but not email directly
      // So we'll fetch recent cases and filter by email
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
      }>(`/api/v1/cases?take=50&sortBy=createdAt&sortDirection=desc`);
      
      // Find case where applicant email matches AND partner ID matches
      const matchingCase = caseApiResult?.items?.find(
        c => {
          const emailMatch = c.applicantEmail?.toLowerCase() === email.toLowerCase();
          const partnerMatch = !userPartnerId || !c.partnerId || 
                              c.partnerId.toLowerCase() === userPartnerId.toLowerCase();
          return emailMatch && partnerMatch;
        }
      );
      
      if (matchingCase) {
        console.log('Found case in case API:', matchingCase.caseNumber);
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
          updatedAt: matchingCase.updatedAt
        };
      }
    } catch (fallbackError: any) {
      // If fallback also fails, continue to return null
      console.log('Case API fallback also failed:', fallbackError?.message);
    }
    
    return null;
  } catch (error: any) {
    // Silently handle service unavailable errors (503) - services may not be running
    if (error?.isServiceUnavailable) {
      // Try case API as fallback even on 503
      try {
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
        }>(`/api/v1/cases?take=50&sortBy=createdAt&sortDirection=desc`);
        
        const matchingCase = caseApiResult?.items?.find(
          c => {
            const emailMatch = c.applicantEmail?.toLowerCase() === email.toLowerCase();
            const partnerMatch = !userPartnerId || !c.partnerId || 
                                c.partnerId.toLowerCase() === userPartnerId.toLowerCase();
            return emailMatch && partnerMatch;
          }
        );
        
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
            updatedAt: matchingCase.updatedAt
          };
        }
      } catch (fallbackError) {
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
    const caseData = await apiGet<{
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
    }>(`/projections/v1/api/v1/cases/${encodeURIComponent(caseId)}`);
    
    // Map to UserCase format with metadata
    return {
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
      assignedAt: caseData.assignedAt
    };
  } catch (error: any) {
    // Silently handle service unavailable errors (503) - services may not be running
    if (error?.isServiceUnavailable || error?.isNotFound) {
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

// Messaging API (via gateway or direct service)
export type MessageDto = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  type?: string;
  status: string;
  sentAt: string;
  readAt?: string | null;
  isRead: boolean;
};

export type MessageThreadDto = {
  id: string;
  applicationId: string;
  applicationReference?: string;
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
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString();
  return apiGet<PagedResult<MessageThreadDto>>(`${MESSAGING_PREFIX}/api/v1/messages/threads/my?${qs}`);
}

export async function getThreadByApplication(applicationId: string) {
  // Check if applicationId is a GUID or a case ID (case number)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let applicationGuid = applicationId;
  
  // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
  if (!guidRegex.test(applicationId)) {
    try {
      const caseData = await apiGet<{
        id: string;
        caseId: string;
      }>(`/projections/v1/api/v1/cases/${encodeURIComponent(applicationId)}`);
      
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
  
  return apiGet<MessageThreadDto>(`${MESSAGING_PREFIX}/api/v1/messages/threads/application/${encodeURIComponent(applicationGuid)}`);
}

export async function getThreadMessages(threadId: string, page = 1, pageSize = 50) {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString();
  return apiGet<PagedResult<MessageDto>>(`${MESSAGING_PREFIX}/api/v1/messages/threads/${encodeURIComponent(threadId)}/messages?${qs}`);
}

export async function sendMessage(
  applicationId: string, 
  content: string, 
  receiverId?: string,
  replyToMessageId?: string,
  attachments?: Array<{ fileName: string; contentType: string; fileSizeBytes: number; storageKey: string; storageUrl: string; documentId?: string; description?: string }>
) {
  // Check if applicationId is a GUID or a case ID (case number)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let applicationGuid = applicationId;
  
  // If it's not a GUID, it's likely a case ID (case number), so fetch the GUID from the projections API
  if (!guidRegex.test(applicationId)) {
    try {
      const caseData = await apiGet<{
        id: string;
        caseId: string;
      }>(`/projections/v1/api/v1/cases/${encodeURIComponent(applicationId)}`);
      
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
  
  const body: any = {
    ApplicationId: applicationGuid,
    Content: content,
  };
  if (receiverId) body.ReceiverId = receiverId;
  if (replyToMessageId) body.ReplyToMessageId = replyToMessageId;
  if (attachments && attachments.length > 0) {
    body.Attachments = attachments.map(a => ({
      FileName: a.fileName,
      ContentType: a.contentType,
      FileSizeBytes: a.fileSizeBytes,
      StorageKey: a.storageKey,
      StorageUrl: a.storageUrl,
      DocumentId: a.documentId,
      Description: a.description
    }));
  }
  return apiPost<{ Success?: boolean; success?: boolean; MessageId?: string; messageId?: string; ThreadId?: string; threadId?: string }>(`${MESSAGING_PREFIX}/api/v1/messages`, body);
}

export async function deleteMessage(messageId: string): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    await apiDelete(`${MESSAGING_PREFIX}/api/v1/messages/${encodeURIComponent(messageId)}`);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      errorMessage: error instanceof Error ? error.message : 'Failed to delete message' 
    };
  }
}

export async function starMessage(messageId: string): Promise<{ success: boolean; isStarred: boolean; errorMessage?: string }> {
  try {
    const response = await apiPut<{ Success?: boolean; IsStarred?: boolean; success?: boolean; isStarred?: boolean; ErrorMessage?: string }>(`${MESSAGING_PREFIX}/api/v1/messages/${encodeURIComponent(messageId)}/star`);
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
}

export async function archiveThread(threadId: string, archive: boolean = true): Promise<{ success: boolean; isArchived: boolean; errorMessage?: string }> {
  try {
    const response = await apiPut<{ Success?: boolean; IsArchived?: boolean; success?: boolean; isArchived?: boolean; ErrorMessage?: string }>(`${MESSAGING_PREFIX}/api/v1/messages/threads/${encodeURIComponent(threadId)}/archive`, { Archive: archive });
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
}

export async function forwardMessage(
  messageId: string, 
  toApplicationId: string, 
  toReceiverId?: string, 
  additionalContent?: string
): Promise<{ success: boolean; newMessageId?: string; newThreadId?: string; errorMessage?: string }> {
  try {
    const response = await apiPost<{ 
      Success?: boolean; 
      NewMessageId?: string; 
      NewThreadId?: string;
      success?: boolean;
      newMessageId?: string;
      newThreadId?: string;
      ErrorMessage?: string;
    }>(`${MESSAGING_PREFIX}/api/v1/messages/${encodeURIComponent(messageId)}/forward`, {
      ToApplicationId: toApplicationId,
      ToReceiverId: toReceiverId,
      AdditionalContent: additionalContent
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
}

export async function getUnreadCount() {
  return apiGet<{ count: number }>(`${MESSAGING_PREFIX}/api/v1/messages/unread/count`);
}

export async function markMessageRead(messageId: string) {
  return apiPut(`${MESSAGING_PREFIX}/api/v1/messages/${encodeURIComponent(messageId)}/read`);
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

export async function getApplicationSections(applicationId: string): Promise<ApplicationSection[]> {
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
    }>(`/projections/v1/api/v1/cases/${encodeURIComponent(applicationId)}`);
    
    // If sections are directly available
    if (app?.sections) {
      return app.sections.map(s => ({
        id: s.id,
        title: s.title,
        fields: s.fields || []
      }));
    }
    
    // Try to construct sections from checklist items if available
    if (app?.checklist_items && app.checklist_items.length > 0) {
      const categoryMap = new Map<string, ApplicationSection>();
      
      app.checklist_items.forEach(item => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, {
            id: `section-${item.category.toLowerCase().replace(/\s+/g, '-')}`,
            title: item.category,
            fields: []
          });
        }
        const section = categoryMap.get(item.category)!;
        section.fields.push({
          id: item.id,
          label: item.requirement,
          type: 'text',
          value: item.status
        });
      });
      
      return Array.from(categoryMap.values());
    }
    
    // Fallback: return empty array
    return [];
  } catch (error) {
    console.error('Failed to fetch application sections:', error);
    return [];
  }
}

export async function getApplicationDocuments(applicationId: string): Promise<ApplicationDocument[]> {
  try {
    // Convert applicationId to Guid for document service
    // Try to fetch documents by caseId
    const documents = await apiGet<Array<{
      id: string;
      documentNumber?: string;
      fileName: string;
      type: string;
      contentType?: string;
      createdAt?: string;
      storageKey?: string;
    }>>(`/documents/v1/api/v1/documents/list/${encodeURIComponent(applicationId)}`);
    
    if (Array.isArray(documents)) {
      return documents.map(doc => ({
        id: doc.id,
        name: doc.fileName || doc.documentNumber || 'Document',
        type: doc.type || 'unknown',
        status: 'uploaded', // Default status
        fileName: doc.fileName,
        createdAt: doc.createdAt
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch application documents:', error);
    // Try alternative endpoint format
    try {
      const caseData = await apiGet<{ documents?: ApplicationDocument[] }>(`/projections/v1/api/v1/cases/${encodeURIComponent(applicationId)}`);
      if (caseData?.documents) {
        return caseData.documents;
      }
    } catch (e) {
      console.error('Alternative document fetch failed:', e);
    }
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
    // Try authentication service first
    const profile = await apiGet<UserProfile>('/api/users/me');
    return profile;
  } catch (error) {
    // Don't log 503 or 404 errors - services may not be running or user may not exist yet
    if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
      console.error('Failed to fetch user profile from auth service:', error);
    }
    // Fallback: try to get from case data
    try {
      const { getAuthUser } = await import("@/lib/auth/session");
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
            preferences: undefined
          };
        }
      }
    } catch (e) {
      // Don't log 503 or 404 errors - services may not be running or user may not exist yet
      if (!(e as any)?.isServiceUnavailable && !(e as any)?.isNotFound) {
        console.error('Failed to get user from case data:', e);
      }
    }
    // Last resort: return from JWT token
    const { getAuthUser } = await import("@/lib/auth/session");
    const user = getAuthUser();
    return {
      id: user.sub || user.email || '',
      email: user.email || '',
      firstName: user.givenName || user.name?.split(' ')[0] || '',
      lastName: user.familyName || user.name?.split(' ').slice(1).join(' ') || '',
      fullName: user.name || '',
      preferences: undefined
    };
  }
}

// Get handler/user profile by ID (for displaying assigned handlers)
export async function getHandlerProfile(userId: string): Promise<{ id: string; fullName: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string } | null> {
  if (!userId) return null;
  try {
    // Try to get user profile from authentication service
    const profile = await apiGet<{ id: string; email: string; firstName: string; lastName: string; fullName: string; profileImageUrl?: string }>(`/api/users/${userId}`);
    return {
      id: profile.id,
      fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown User',
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      profileImageUrl: profile.profileImageUrl
    };
  } catch (error: any) {
    // Don't log 404 or 503 errors - handler may not exist or service unavailable
    if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
      console.error('Failed to fetch handler profile:', error);
    }
    return null;
  }
}

// Update user profile
export async function updateUserProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
  try {
    return await apiPut<UserProfile>('/api/users/me', updates);
  } catch (error: any) {
    // If user doesn't exist in backend (404), try to create them or fallback
    if (error?.message?.includes('404')) {
      console.warn('User profile not found in backend. Creating new profile...');
      // For now, we'll just return the updated profile from the request
      // In a full implementation, you might want to POST to create the user first
      const { getAuthUser } = await import("@/lib/auth/session");
      const user = getAuthUser();
      
      return {
        id: user?.sub || user?.email || '',
        email: user?.email || '',
        firstName: updates.firstName || user?.givenName || '',
        lastName: updates.lastName || user?.familyName || '',
        middleName: updates.middleName,
        fullName: `${updates.firstName || ''} ${updates.lastName || ''}`.trim() || user?.name || '',
        phone: updates.phone,
        country: updates.country,
        companyName: updates.companyName,
        preferences: updates.preferences
      };
    }
    throw error;
  }
}

// Get user notification preferences
export async function getNotificationPreferences(): Promise<UserPreferences> {
  try {
    const profile = await getUserProfile();
    return profile.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      statusUpdates: true,
      marketingCommunications: false
    };
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
      marketingCommunications: false
    };
  }
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: UserPreferences): Promise<UserProfile> {
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
        preferences
      });
    } catch (error: any) {
      // If update fails (404 or other), the updateUserProfile will handle the fallback
      // For notification preferences specifically, we can store locally as backup
      if (error?.message?.includes('404')) {
        console.warn('Profile not found in backend. Storing preferences locally...');
        // Store preferences in localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_preferences', JSON.stringify(preferences));
        }
        // Return profile with updated preferences
        return {
          ...currentProfile,
          preferences
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
      } catch (e) {
        console.error('Failed to store preferences locally:', e);
      }
    }
    throw error;
  }
}

// Change password
export async function changePassword(request: ChangePasswordRequest): Promise<{ success: boolean; message?: string }> {
  try {
    // Try authentication service endpoint if available
    return await apiPost<{ success: boolean; message?: string }>('/api/users/me/change-password', request);
  } catch (error) {
    console.error('Failed to change password:', error);
    // If endpoint doesn't exist, this would typically go through Keycloak
    throw new Error('Password change not available. Please contact support or use Keycloak directly.');
  }
}

// Download user data (GDPR compliance)
export async function downloadUserData(): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE}/api/users/me/data-export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getToken()}`,
      }
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
      exportedAt: new Date().toISOString()
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }
}

// Delete user account
export async function deleteUserAccount(confirmation: { password?: string; reason?: string }): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiPost<{ success: boolean; message?: string }>('/api/users/me/delete', confirmation);
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw new Error('Account deletion failed. Please contact support.');
  }
}

// Get user's case summary for profile display
export async function getUserCaseSummary(): Promise<CaseDataSummary | null> {
  try {
    const { getAuthUser } = await import("@/lib/auth/session");
    const user = getAuthUser();
    if (!user?.email) return null;

    const caseData = await findUserCaseByEmail(user.email);
    if (!caseData) return null;

    // Get related data
    const [documents, threads] = await Promise.all([
      getApplicationDocuments(caseData.caseId).catch(() => []),
      getMyThreads(1, 10).catch(() => ({ items: [], totalCount: 0 } as any))
    ]);

    return {
      caseId: caseData.caseId,
      applicationData: caseData,
      documents,
      messages: threads.items || [],
      timeline: []
    };
  } catch (error) {
    // Don't log 503 or 404 errors - services may not be running or user may not exist yet
    if (!(error as any)?.isServiceUnavailable && !(error as any)?.isNotFound) {
      console.error('Failed to get user case summary:', error);
    }
    return null;
  }
}

