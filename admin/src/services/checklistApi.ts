import { getSession } from 'next-auth/react';

// Use Next.js API route proxy (same origin, no CORS issues)
const CHECKLIST_API_BASE_URL = typeof window !== 'undefined' 
  ? '' // Use relative URL in browser (will use Next.js API route)
  : (process.env.CHECKLIST_API_BASE_URL || 
     process.env.NEXT_PUBLIC_CHECKLIST_API_BASE_URL ||
     'http://127.0.0.1:8086');

// Backend DTO types matching ChecklistDto
export interface ChecklistDto {
  id: string;
  caseId: string;
  type: string;
  status: string;
  partnerId: string;
  createdAt: string;
  completedAt?: string;
  completionPercentage: number;
  requiredCompletionPercentage: number;
  items: ChecklistItemDto[];
}

export interface ChecklistItemDto {
  id: string;
  name: string;
  description: string;
  category: string;
  isRequired: boolean;
  order: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  skipReason?: string;
}

// Frontend interface for checklist display
export interface Checklist {
  id: string;
  name: string;
  entityType: string;
  description: string;
  items: ChecklistItem[];
  lastUpdated: string;
  isActive: boolean;
  version: string;
  createdBy: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  isRequired: boolean;
  category: string;
  order: number;
  guidelines?: string;
}

class ChecklistApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // DO NOT send accessToken - API proxy will inject it from Redis
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

    // Add development headers for backend services (fallback)
    if (process.env.NODE_ENV === 'development' && !session?.user?.email) {
      headers['X-User-Id'] = 'admin-user-id';
      headers['X-User-Email'] = 'admin@mukuru.com';
      headers['X-User-Name'] = 'Admin User';
      headers['X-User-Role'] = 'Administrator';
    }

    return headers;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });

      const fetchPromise = fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Checklist API request failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          if (errorText && errorText.trim().length > 0) {
            errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('timeout'))) {
        throw new Error('Unable to connect to Checklist service. Please ensure the service is running.');
      }
      throw error;
    }
  }

  /**
   * Map backend ChecklistDto to frontend Checklist format
   */
  private mapChecklistDto(dto: ChecklistDto): Checklist {
    // Normalize snake_case to camelCase
    const caseId = dto.caseId || dto.case_id || '';
    const createdAt = dto.createdAt || dto.created_at || new Date().toISOString();
    const completedAt = dto.completedAt || dto.completed_at;
    const type = dto.type || '';
    
    // Debug logging
    console.log('[ChecklistApi] Mapping DTO:', {
      id: dto.id,
      caseId: caseId,
      type: type,
      rawCaseId: dto.caseId,
      rawCase_id: dto.case_id
    });
    
    // Extract entity type from checklist type or case metadata
    const entityType = this.extractEntityType(type, caseId);
    
    console.log('[ChecklistApi] Extracted entity type:', entityType, 'from caseId:', caseId, 'type:', type);
    
    // Generate a display name from the type and case ID
    const name = `${entityType} Checklist`;
    
    // Generate description
    const description = `Checklist for ${entityType.toLowerCase()} onboarding`;
    
    // Map items
    const items: ChecklistItem[] = (dto.items || []).map(item => ({
      id: item.id,
      description: item.description || item.name,
      isRequired: item.isRequired,
      category: item.category,
      order: item.order,
      guidelines: item.notes || undefined,
    }));

    // Format date properly
    let lastUpdated = completedAt || createdAt;
    try {
      const date = new Date(lastUpdated);
      if (isNaN(date.getTime())) {
        lastUpdated = new Date().toISOString();
      } else {
        lastUpdated = date.toISOString();
      }
    } catch {
      lastUpdated = new Date().toISOString();
    }

    return {
      id: dto.id,
      name,
      entityType,
      description,
      items,
      lastUpdated,
      isActive: dto.status !== 'Completed' && dto.status !== 'Cancelled',
      version: this.calculateVersion(createdAt),
      createdBy: 'System', // Backend doesn't provide this, could be enhanced
    };
  }

  /**
   * Extract entity type from checklist case ID or type
   */
  private extractEntityType(type: string, caseId?: string): string {
    // First try to extract from case ID (most reliable)
    if (caseId && caseId.trim()) {
      const caseUpper = caseId.toUpperCase().trim();
      
      console.log('[extractEntityType] Checking case ID:', caseId, '->', caseUpper);
      
      // Use exact pattern matching for case IDs - check in order of specificity
      // Check for NPO first (most specific)
      if (caseUpper.includes('CASE-NPO') || caseUpper.includes('-NPO-')) {
        console.log('[extractEntityType] Matched NPO from case ID');
        return 'NPO';
      }
      // Check for Government
      if (caseUpper.includes('CASE-GOV') || caseUpper.includes('-GOV-')) {
        console.log('[extractEntityType] Matched Government from case ID');
        return 'Government';
      }
      // Check for Publicly Listed (before Private to avoid conflicts)
      if (caseUpper.includes('CASE-PUBLIC') || caseUpper.includes('-PUBLIC-')) {
        console.log('[extractEntityType] Matched Publicly Listed from case ID');
        return 'Publicly Listed';
      }
      // Check for Private Company
      if (caseUpper.includes('CASE-PRIVATE') || caseUpper.includes('-PRIVATE-')) {
        console.log('[extractEntityType] Matched Private Company from case ID');
        return 'Private Company';
      }
      
      // Fallback to substring matching with exclusions
      if (caseUpper.includes('NPO') && !caseUpper.includes('NONPROFIT') && !caseUpper.includes('PRIVATE')) {
        console.log('[extractEntityType] Matched NPO from substring');
        return 'NPO';
      }
      if (caseUpper.includes('GOV') && !caseUpper.includes('PRIVATE')) {
        console.log('[extractEntityType] Matched Government from substring');
        return 'Government';
      }
      if (caseUpper.includes('PUBLIC') && !caseUpper.includes('PRIVATE')) {
        console.log('[extractEntityType] Matched Publicly Listed from substring');
        return 'Publicly Listed';
      }
      if (caseUpper.includes('PRIVATE')) {
        console.log('[extractEntityType] Matched Private Company from substring');
        return 'Private Company';
      }
      
      console.warn('[extractEntityType] No match found for case ID:', caseId);
    }
    
    // Fallback to type
    const typeUpper = (type || '').toUpperCase().trim();
    console.log('[extractEntityType] Falling back to type:', type, '->', typeUpper);
    
    if (typeUpper.includes('PRIVATE') || (typeUpper.includes('COMPANY') && !typeUpper.includes('PUBLIC'))) {
      return 'Private Company';
    }
    if (typeUpper.includes('NPO') || typeUpper.includes('NONPROFIT')) {
      return 'NPO';
    }
    if (typeUpper.includes('GOVERNMENT') || typeUpper.includes('GOV')) {
      return 'Government';
    }
    if (typeUpper.includes('PUBLICLY') || typeUpper.includes('LISTED') || (typeUpper.includes('PUBLIC') && typeUpper.includes('COMPANY'))) {
      return 'Publicly Listed';
    }
    if (typeUpper.includes('CORPORATE')) {
      // Corporate type is ambiguous - default to Private Company
      console.warn('[extractEntityType] Corporate type found, defaulting to Private Company');
      return 'Private Company';
    }
    console.warn('[extractEntityType] No match found, defaulting to Private Company');
    return 'Private Company'; // Default
  }

  /**
   * Calculate version from creation date
   */
  private calculateVersion(createdAt: string): string {
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        return '1.0';
      }
      const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
      const major = Math.floor(daysSinceEpoch / 1000) + 1;
      const minor = (daysSinceEpoch % 100) / 10;
      return `${major}.${minor.toFixed(1)}`;
    } catch {
      return '1.0';
    }
  }

  /**
   * Transform snake_case backend response to camelCase
   */
  private transformBackendDto(rawDto: any): ChecklistDto {
    return {
      id: rawDto.id || rawDto.Id,
      caseId: rawDto.caseId || rawDto.case_id || rawDto.CaseId,
      case_id: rawDto.case_id || rawDto.caseId,
      type: rawDto.type || rawDto.Type,
      status: rawDto.status || rawDto.Status,
      partnerId: rawDto.partnerId || rawDto.partner_id || rawDto.PartnerId,
      partner_id: rawDto.partner_id || rawDto.partnerId,
      createdAt: rawDto.createdAt || rawDto.created_at || rawDto.CreatedAt,
      created_at: rawDto.created_at || rawDto.createdAt,
      completedAt: rawDto.completedAt || rawDto.completed_at || rawDto.CompletedAt,
      completed_at: rawDto.completed_at || rawDto.completedAt,
      completionPercentage: rawDto.completionPercentage || rawDto.completion_percentage || rawDto.CompletionPercentage || 0,
      completion_percentage: rawDto.completion_percentage || rawDto.completionPercentage,
      requiredCompletionPercentage: rawDto.requiredCompletionPercentage || rawDto.required_completion_percentage || rawDto.RequiredCompletionPercentage || 0,
      required_completion_percentage: rawDto.required_completion_percentage || rawDto.requiredCompletionPercentage,
      items: (rawDto.items || []).map((item: any) => ({
        id: item.id || item.Id,
        name: item.name || item.Name,
        description: item.description || item.Description,
        category: item.category || item.Category,
        isRequired: item.isRequired !== undefined ? item.isRequired : (item.is_required !== undefined ? item.is_required : false),
        order: item.order || item.Order || 0,
        status: item.status || item.Status,
        createdAt: item.createdAt || item.created_at || item.CreatedAt,
        completedAt: item.completedAt || item.completed_at || item.CompletedAt,
        completedBy: item.completedBy || item.completed_by || item.CompletedBy,
        notes: item.notes || item.Notes,
        skipReason: item.skipReason || item.skip_reason || item.SkipReason,
      })),
    };
  }

  /**
   * Get all checklists
   */
  async getAllChecklists(): Promise<Checklist[]> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists`;
    try {
      const rawResponse = await this.request<any[]>(url);
      
      console.log('[ChecklistApi] getAllChecklists - Raw response:', rawResponse);
      
      // Handle empty array or null response
      if (!rawResponse || !Array.isArray(rawResponse)) {
        console.log('[ChecklistApi] No response or not an array');
        return [];
      }
      
      // Transform and map backend DTOs to frontend format
      const mapped = rawResponse.map(rawDto => {
        const transformedDto = this.transformBackendDto(rawDto);
        console.log('[ChecklistApi] Transformed DTO:', {
          raw: rawDto,
          transformed: transformedDto
        });
        const mappedChecklist = this.mapChecklistDto(transformedDto);
        console.log('[ChecklistApi] Mapped checklist:', {
          originalCaseId: transformedDto.caseId || transformedDto.case_id,
          originalType: transformedDto.type,
          mappedEntityType: mappedChecklist.entityType,
          mappedName: mappedChecklist.name
        });
        return mappedChecklist;
      });
      
      console.log('[ChecklistApi] Final mapped checklists:', mapped);
      return mapped;
    } catch (error) {
      // If 404 or empty response, return empty array
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('500'))) {
        console.warn('No checklists found or service error:', error.message);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get checklist by ID
   */
  async getChecklistById(id: string): Promise<Checklist | null> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists/${id}`;
    try {
      const dto = await this.request<ChecklistDto>(url);
      return this.mapChecklistDto(dto);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get checklist by case ID
   */
  async getChecklistByCase(caseId: string): Promise<Checklist | null> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists/case/${encodeURIComponent(caseId)}`;
    try {
      const dto = await this.request<ChecklistDto>(url);
      return this.mapChecklistDto(dto);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}

export const checklistApiService = new ChecklistApiService();

