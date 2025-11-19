// Applications API service for connecting to backend projections API
import workQueueApi from './workQueueApi';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3001';

// Backend DTO types from OnboardingCaseProjection
export interface OnboardingCaseProjection {
  id: string;
  caseId: string;
  type: string;
  status: string;
  partnerId: string;
  partnerName: string;
  partnerReferenceId: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantDateOfBirth?: string;
  applicantNationality: string;
  applicantAddress: string;
  applicantCity: string;
  applicantCountry: string;
  progressPercentage: number;
  totalSteps: number;
  completedSteps: number;
  checklistId?: string;
  checklistStatus: string;
  checklistCompletionPercentage: number;
  checklistTotalItems: number;
  checklistCompletedItems: number;
  checklistRequiredItems: number;
  checklistCompletedRequiredItems: number;
  riskAssessmentId?: string;
  riskLevel: string;
  riskScore: number;
  riskStatus: string;
  riskFactorCount: number;
  documentCount: number;
  verifiedDocumentCount: number;
  pendingDocumentCount: number;
  rejectedDocumentCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  requiresManualReview: boolean;
  hasComplianceIssues: boolean;
  complianceNotes?: string;
  metadataJson: string;
  businessLegalName: string;
  businessRegistrationNumber: string;
  businessTaxId: string;
  businessCountryOfRegistration: string;
  businessAddress: string;
  businessCity: string;
  businessIndustry: string;
  businessNumberOfEmployees?: number;
  businessAnnualRevenue?: number;
  businessWebsite: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Frontend Application interface
export interface Application {
  id: string;
  companyName: string;
  entityType: string;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RISK_REVIEW' | 'COMPLETE' | 'DECLINED';
  submittedDate: string;
  assignedTo: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  country: string;
  progress: number;
}

// Status mapping from backend to frontend
function mapBackendStatusToFrontend(backendStatus: string): Application['status'] {
  const statusMap: Record<string, Application['status']> = {
    'Draft': 'IN_PROGRESS',
    'InProgress': 'IN_PROGRESS',
    'PendingReview': 'RISK_REVIEW',
    'Submitted': 'SUBMITTED',
    'Approved': 'COMPLETE',
    'Rejected': 'DECLINED',
    'Cancelled': 'DECLINED',
  };
  
  return statusMap[backendStatus] || 'IN_PROGRESS';
}

// Risk level mapping from backend to frontend
function mapBackendRiskLevelToFrontend(riskLevel: string): Application['riskLevel'] {
  const riskMap: Record<string, Application['riskLevel']> = {
    'Low': 'LOW',
    'MediumLow': 'LOW',
    'Medium': 'MEDIUM',
    'MediumHigh': 'HIGH',
    'High': 'HIGH',
  };
  
  return riskMap[riskLevel] || 'MEDIUM';
}

// Map OnboardingCaseProjection to Application
function mapProjectionToApplication(projection: OnboardingCaseProjection): Application {
  // Determine company name - use business legal name if available, otherwise use applicant name
  const companyName = projection.businessLegalName || 
                     `${projection.applicantFirstName} ${projection.applicantLastName}`.trim() ||
                     'Unknown';
  
  // Determine country - use business country if available, otherwise use applicant country
  const country = projection.businessCountryOfRegistration || 
                 projection.applicantCountry || 
                 'Unknown';
  
  // Determine entity type - use type from projection, or derive from business info
  const entityType = projection.type || 
                    (projection.businessLegalName ? 'Business' : 'Individual') ||
                    'Unknown';
  
  // Get assigned to name or fallback
  const assignedTo = projection.assignedToName || 
                    projection.assignedTo || 
                    'Unassigned';
  
  // Get submitted date or created date
  const submittedDate = projection.submittedAt || 
                       projection.createdAt;
  
  // Get progress percentage (round to integer)
  const progress = Math.round(projection.progressPercentage || 0);

  return {
    id: projection.caseId || projection.id,
    companyName,
    entityType,
    status: mapBackendStatusToFrontend(projection.status),
    submittedDate,
    assignedTo,
    riskLevel: mapBackendRiskLevelToFrontend(projection.riskLevel),
    country,
    progress,
  };
}

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
      if (session?.user?.role) {
        headers['X-User-Role'] = session.user.role;
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('./sentry-client');
        clientSentry.reportError(error, {
          tags: { error_type: 'applications_api', operation: 'get_session' },
          level: 'warning',
        });
      }
    }
  }

  return headers;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Applications API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    // If it's a connection error, provide a more helpful message
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to Applications API at ${url}. Please ensure the backend services are running.`);
    }
    throw error;
  }
}

export const applicationsApi = {
  /**
   * Get all applications with optional filters
   */
  async getApplications(filters?: {
    status?: string;
    search?: string;
    riskLevel?: string;
    assignedTo?: string;
    partnerId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Application[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'ALL') {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        'SUBMITTED': 'Submitted',
        'IN_PROGRESS': 'InProgress',
        'RISK_REVIEW': 'PendingReview',
        'COMPLETE': 'Approved',
        'DECLINED': 'Rejected',
      };
      const backendStatus = statusMap[filters.status] || filters.status;
      params.append('status', backendStatus);
    }
    
    if (filters?.search) {
      params.append('searchTerm', filters.search);
    }
    
    if (filters?.riskLevel) {
      // Map frontend risk level to backend risk level
      const riskMap: Record<string, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
      };
      const backendRiskLevel = riskMap[filters.riskLevel] || filters.riskLevel;
      params.append('riskLevel', backendRiskLevel);
    }
    
    if (filters?.assignedTo) {
      params.append('assignedTo', filters.assignedTo);
    }
    
    if (filters?.partnerId) {
      params.append('partnerId', filters.partnerId);
    }
    
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 100;
    const skip = (page - 1) * pageSize;
    params.append('skip', skip.toString());
    params.append('take', pageSize.toString());
    
    // Add default sorting
    params.append('sortBy', 'createdAt');
    params.append('sortDirection', 'desc');
    
    const queryString = params.toString();
    const result = await request<PagedResult<OnboardingCaseProjection>>(`/api/applications?${queryString}`);
    
    // Handle both camelCase (from JSON) and PascalCase (if any)
    const items = result.items || (result as any).Items || [];
    const total = result.totalCount || (result as any).TotalCount || 0;
    
    // FIRST: Fetch assignment data from work queue service (source of truth for assignments)
    let workItemsMap = new Map<string, { assignedTo?: string; assignedToName?: string; workItemId?: string; applicationId?: string }>();
    let workItemsList: any[] = [];
    
    try {
      console.log('[Applications API] Fetching work items from work queue (source of truth for assignments)...');
      // Use getWorkItemsAsDto to get raw DTOs with all fields
      const workItemsResult = await workQueueApi.getWorkItemsAsDto({ pageSize: 1000 });
      
      console.log('[Applications API] Work items fetched:', workItemsResult.data.length);
      workItemsList = workItemsResult.data;
      
      // Create comprehensive mapping: work item applicationId (GUID) -> assignment data
      // Work items store applicationId as GUID, which should match projection.id (GUID)
      workItemsResult.data.forEach(workItem => {
        if (workItem.applicationId) {
          // Normalize GUID to lowercase for matching
          const normalizedGuid = workItem.applicationId.toLowerCase().trim();
          workItemsMap.set(normalizedGuid, {
            assignedTo: workItem.assignedTo,
            assignedToName: workItem.assignedToName,
            workItemId: workItem.id, // WorkItemDto uses 'id' property
            applicationId: workItem.applicationId,
          });
        }
      });
      
      console.log('[Applications API] Work items map created with', workItemsMap.size, 'entries');
      console.log('[Applications API] Sample work items:', workItemsResult.data.slice(0, 5).map(wi => ({
        applicationId: wi.applicationId,
        workItemId: wi.id, // WorkItemDto uses 'id' property
        assignedToName: wi.assignedToName,
        assignedTo: wi.assignedTo
      })));
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('./sentry-client');
        clientSentry.reportError(error, {
          tags: { error_type: 'applications_api', operation: 'fetch_work_items' },
          level: 'error',
        });
      }
      // Continue without work queue data - will use projection data only
    }
    
    // Map projections to applications and ENRICH with work queue assignment data
    const enrichedApplications = items.map(projection => {
      // First create base application from projection
      const app = mapProjectionToApplication(projection);
      
      console.log('[Applications API] Processing projection:', {
        caseId: projection.caseId,
        id: projection.id,
        appId: app.id
      });
      
      // Try to find assignment in work queue by matching projection.id (GUID) with workItem.applicationId (GUID)
      let assignment = null;
      
      // Method 1: Match by GUID (projection.id with workItem.applicationId)
      if (projection.id) {
        const normalizedId = projection.id.toLowerCase().trim();
        assignment = workItemsMap.get(normalizedId);
        
        if (assignment) {
          console.log('[Applications API] ✅ Matched by GUID (projection.id):', {
            projectionId: projection.id,
            projectionCaseId: projection.caseId,
            assignedToName: assignment.assignedToName,
            assignedTo: assignment.assignedTo
          });
        }
      }
      
      // Method 2: If no match, try matching by caseId (search all work items)
      if (!assignment && projection.caseId) {
        // Search through all work items to find one that might match
        // This is a fallback in case the GUIDs don't match
        const matchingWorkItem = workItemsList.find(wi => {
          // Check if work item's applicationId matches projection.id
          if (wi.applicationId && projection.id) {
            return wi.applicationId.toLowerCase().trim() === projection.id.toLowerCase().trim();
          }
          return false;
        });
        
        if (matchingWorkItem && (matchingWorkItem.assignedTo || matchingWorkItem.assignedToName)) {
          assignment = {
            assignedTo: matchingWorkItem.assignedTo,
            assignedToName: matchingWorkItem.assignedToName,
            workItemId: matchingWorkItem.workItemId,
            applicationId: matchingWorkItem.applicationId,
          };
          console.log('[Applications API] ✅ Matched by searching work items:', {
            projectionCaseId: projection.caseId,
            projectionId: projection.id,
            workItemApplicationId: matchingWorkItem.applicationId,
            assignedToName: assignment.assignedToName
          });
        }
      }
      
      // Method 3: Try matching app.id (which is caseId or id) with work item applicationId
      if (!assignment && app.id) {
        // Check if app.id is a GUID
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app.id);
        if (isGuid) {
          assignment = workItemsMap.get(app.id.toLowerCase().trim());
          if (assignment) {
            console.log('[Applications API] ✅ Matched by app.id (GUID):', {
              appId: app.id,
              assignedToName: assignment.assignedToName
            });
          }
        }
      }
      
      // If assignment found in work queue, use it (work queue is source of truth)
      if (assignment && (assignment.assignedTo || assignment.assignedToName)) {
        const assignedName = assignment.assignedToName || assignment.assignedTo;
        console.log('[Applications API] ✅ Using work queue assignment:', {
          appId: app.id,
          projectionId: projection.id,
          projectionCaseId: projection.caseId,
          assignedName,
          workItemId: assignment.workItemId
        });
        return {
          ...app,
          assignedTo: assignedName, // Work queue assignment takes priority
          workItemId: assignment.workItemId, // Include workItemId for review navigation
        } as Application & { workItemId?: string };
      }
      
      // If no work queue assignment found, still try to find workItemId for review navigation
      let workItemId: string | undefined = undefined;
      if (projection.id) {
        const matchingWorkItem = workItemsList.find(wi => 
          wi.applicationId && projection.id && 
          wi.applicationId.toLowerCase().trim() === projection.id.toLowerCase().trim()
        );
        if (matchingWorkItem) {
          workItemId = matchingWorkItem.id; // WorkItemDto uses 'id' property
        }
      }
      
      console.log('[Applications API] ⚠️ No work queue assignment found:', {
        appId: app.id,
        projectionId: projection.id,
        projectionCaseId: projection.caseId,
        workItemsMapSize: workItemsMap.size,
        totalWorkItems: workItemsList.length,
        hasProjectionId: !!projection.id,
        checkedGuid: projection.id ? workItemsMap.has(projection.id.toLowerCase().trim()) : false,
        allWorkItemApplicationIds: workItemsList.slice(0, 3).map(wi => wi.applicationId),
        foundWorkItemId: !!workItemId,
      });
      
      // Return app with projection data (may show "Unassigned" if no work queue assignment)
      return {
        ...app,
        workItemId, // Include workItemId if found, even without assignment
      } as Application & { workItemId?: string };
    });
    
    console.log('[Applications API] Final enriched applications:', enrichedApplications.map(app => ({
      id: app.id,
      assignedTo: app.assignedTo
    })));
    
    return {
      data: enrichedApplications,
      total: total,
    };
  },

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<Application | null> {
    try {
      // First try to get from the cases endpoint with search
      const params = new URLSearchParams();
      params.append('searchTerm', id);
      params.append('take', '1');
      
      const result = await request<PagedResult<OnboardingCaseProjection>>(`/api/applications?${params.toString()}`);
      
      const projection = result.items.find(
        p => p.caseId === id || p.id === id
      );
      
      if (projection) {
        return mapProjectionToApplication(projection);
      }
      
      return null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Export applications as CSV
   */
  async exportApplications(filters?: {
    status?: string;
    search?: string;
    riskLevel?: string;
  }): Promise<Blob> {
    // Get all items for export (no pagination)
    const result = await this.getApplications({
      ...filters,
      page: 1,
      pageSize: 10000,
    });
    
    // Convert to CSV
    const csvRows: string[] = [];
    
    // CSV Header
    csvRows.push('Application ID,Company Name,Entity Type,Country,Status,Risk Level,Assigned To,Progress,Submitted Date');
    
    // CSV Data
    result.data.forEach(app => {
      csvRows.push([
        app.id,
        `"${app.companyName}"`,
        app.entityType,
        app.country,
        app.status,
        app.riskLevel,
        app.assignedTo,
        `${app.progress}%`,
        new Date(app.submittedDate).toLocaleDateString(),
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  },
};

export default applicationsApi;

