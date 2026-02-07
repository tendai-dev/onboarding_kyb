import { getSession } from 'next-auth/react';

// Use Next.js API route proxy (same origin, no CORS issues)
const CHECKLIST_API_BASE_URL =
  typeof window !== 'undefined'
    ? '' // Use relative URL in browser (will use Next.js API route)
    : process.env.CHECKLIST_API_BASE_URL ||
      process.env.NEXT_PUBLIC_CHECKLIST_API_BASE_URL ||
      'http://127.0.0.1:8086';

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
    if (session?.user && 'role' in session.user) {
      const userRole = (session.user as { role?: string }).role;
      if (userRole) {
        headers['X-User-Role'] = String(userRole);
      }
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
            errorMessage =
              errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }

        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes('timeout'))
      ) {
        throw new Error(
          'Unable to connect to Checklist service. Please ensure the service is running.'
        );
      }
      throw error;
    }
  }

  /**
   * Map backend ChecklistDto to frontend Checklist format
   */
  private mapChecklistDto(dto: ChecklistDto): Checklist {
    // Normalize snake_case to camelCase
    const caseId = dto.caseId || '';
    const createdAt = dto.createdAt || new Date().toISOString();
    const completedAt = dto.completedAt;
    const type = dto.type || '';

    // Debug logging
    console.info('[ChecklistApi] Mapping DTO:', {
      id: dto.id,
      caseId: caseId,
      type: type,
      rawCaseId: dto.caseId,
    });

    // Extract entity type from checklist type or case metadata
    const entityType = this.extractEntityType(type, caseId);

    console.info(
      '[ChecklistApi] Extracted entity type:',
      entityType,
      'from caseId:',
      caseId,
      'type:',
      type
    );

    // Generate a display name from the type and case ID
    const name = `${entityType} Checklist`;

    // Generate description
    const description = `Checklist for ${entityType.toLowerCase()} onboarding`;

    // Map items
    const items: ChecklistItem[] = (dto.items || []).map((item) => ({
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

      console.info('[extractEntityType] Checking case ID:', caseId, '->', caseUpper);

      // Use exact pattern matching for case IDs - check in order of specificity
      // Check for NPO first (most specific)
      if (caseUpper.includes('CASE-NPO') || caseUpper.includes('-NPO-')) {
        console.info('[extractEntityType] Matched NPO from case ID');
        return 'NPO';
      }
      // Check for Government
      if (caseUpper.includes('CASE-GOV') || caseUpper.includes('-GOV-')) {
        console.info('[extractEntityType] Matched Government from case ID');
        return 'Government';
      }
      // Check for Publicly Listed (before Private to avoid conflicts)
      if (caseUpper.includes('CASE-PUBLIC') || caseUpper.includes('-PUBLIC-')) {
        console.info('[extractEntityType] Matched Publicly Listed from case ID');
        return 'Publicly Listed';
      }
      // Check for Private Company
      if (caseUpper.includes('CASE-PRIVATE') || caseUpper.includes('-PRIVATE-')) {
        console.info('[extractEntityType] Matched Private Company from case ID');
        return 'Private Company';
      }

      // Fallback to substring matching with exclusions
      if (
        caseUpper.includes('NPO') &&
        !caseUpper.includes('NONPROFIT') &&
        !caseUpper.includes('PRIVATE')
      ) {
        console.info('[extractEntityType] Matched NPO from substring');
        return 'NPO';
      }
      if (caseUpper.includes('GOV') && !caseUpper.includes('PRIVATE')) {
        console.info('[extractEntityType] Matched Government from substring');
        return 'Government';
      }
      if (caseUpper.includes('PUBLIC') && !caseUpper.includes('PRIVATE')) {
        console.info('[extractEntityType] Matched Publicly Listed from substring');
        return 'Publicly Listed';
      }
      if (caseUpper.includes('PRIVATE')) {
        console.info('[extractEntityType] Matched Private Company from substring');
        return 'Private Company';
      }

      console.warn('[extractEntityType] No match found for case ID:', caseId);
    }

    // Fallback to type
    const typeUpper = (type || '').toUpperCase().trim();
    console.info('[extractEntityType] Falling back to type:', type, '->', typeUpper);

    if (
      typeUpper.includes('PRIVATE') ||
      (typeUpper.includes('COMPANY') && !typeUpper.includes('PUBLIC'))
    ) {
      return 'Private Company';
    }
    if (typeUpper.includes('NPO') || typeUpper.includes('NONPROFIT')) {
      return 'NPO';
    }
    if (typeUpper.includes('GOVERNMENT') || typeUpper.includes('GOV')) {
      return 'Government';
    }
    if (
      typeUpper.includes('PUBLICLY') ||
      typeUpper.includes('LISTED') ||
      (typeUpper.includes('PUBLIC') && typeUpper.includes('COMPANY'))
    ) {
      return 'Publicly Listed';
    }
    if (typeUpper.includes('CORPORATE')) {
      // Corporate type is ambiguous - default to Private Company
      console.warn(
        '[extractEntityType] Corporate type found, defaulting to Private Company'
      );
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
  private transformBackendDto(rawDto: Record<string, unknown>): ChecklistDto {
    return {
      id: String(rawDto.id || rawDto.Id || ''),
      caseId: String(rawDto.caseId || rawDto.case_id || rawDto.CaseId || ''),
      type: String(rawDto.type || rawDto.Type || ''),
      status: String(rawDto.status || rawDto.Status || ''),
      partnerId: String(rawDto.partnerId || rawDto.partner_id || rawDto.PartnerId || ''),
      createdAt: String(
        rawDto.createdAt ||
          rawDto.created_at ||
          rawDto.CreatedAt ||
          new Date().toISOString()
      ),
      completedAt:
        rawDto.completedAt || rawDto.completed_at || rawDto.CompletedAt
          ? String(rawDto.completedAt || rawDto.completed_at || rawDto.CompletedAt)
          : undefined,
      completionPercentage:
        typeof rawDto.completionPercentage === 'number'
          ? rawDto.completionPercentage
          : typeof rawDto.completion_percentage === 'number'
            ? rawDto.completion_percentage
            : typeof rawDto.CompletionPercentage === 'number'
              ? rawDto.CompletionPercentage
              : 0,
      requiredCompletionPercentage:
        typeof rawDto.requiredCompletionPercentage === 'number'
          ? rawDto.requiredCompletionPercentage
          : typeof rawDto.required_completion_percentage === 'number'
            ? rawDto.required_completion_percentage
            : typeof rawDto.RequiredCompletionPercentage === 'number'
              ? rawDto.RequiredCompletionPercentage
              : 0,
      items: (Array.isArray(rawDto.items) ? rawDto.items : []).map((item: unknown) => {
        const itemObj = item as Record<string, unknown>;
        return {
          id: String(itemObj.id || itemObj.Id || ''),
          name: String(itemObj.name || itemObj.Name || ''),
          description: String(itemObj.description || itemObj.Description || ''),
          category: String(itemObj.category || itemObj.Category || ''),
          isRequired:
            itemObj.isRequired !== undefined
              ? Boolean(itemObj.isRequired)
              : itemObj.is_required !== undefined
                ? Boolean(itemObj.is_required)
                : false,
          order:
            typeof itemObj.order === 'number'
              ? itemObj.order
              : typeof itemObj.Order === 'number'
                ? itemObj.Order
                : 0,
          status: String(itemObj.status || itemObj.Status || ''),
          createdAt: String(
            itemObj.createdAt ||
              itemObj.created_at ||
              itemObj.CreatedAt ||
              new Date().toISOString()
          ),
          completedAt:
            itemObj.completedAt || itemObj.completed_at || itemObj.CompletedAt
              ? String(itemObj.completedAt || itemObj.completed_at || itemObj.CompletedAt)
              : undefined,
          completedBy:
            itemObj.completedBy || itemObj.completed_by || itemObj.CompletedBy
              ? String(itemObj.completedBy || itemObj.completed_by || itemObj.CompletedBy)
              : undefined,
          notes:
            itemObj.notes || itemObj.Notes
              ? String(itemObj.notes || itemObj.Notes)
              : undefined,
          skipReason:
            itemObj.skipReason || itemObj.skip_reason || itemObj.SkipReason
              ? String(itemObj.skipReason || itemObj.skip_reason || itemObj.SkipReason)
              : undefined,
        };
      }),
    };
  }

  /**
   * Get all checklists
   */
  async getAllChecklists(): Promise<Checklist[]> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists`;
    try {
      const rawResponse = await this.request<unknown[]>(url);

      console.info('[ChecklistApi] getAllChecklists - Raw response:', rawResponse);

      // Handle empty array or null response
      if (!rawResponse || !Array.isArray(rawResponse)) {
        console.info('[ChecklistApi] No response or not an array');
        return [];
      }

      // Transform and map backend DTOs to frontend format
      const mapped = rawResponse.map((rawDto: unknown) => {
        const transformedDto = this.transformBackendDto(
          rawDto as Record<string, unknown>
        );
        console.info('[ChecklistApi] Transformed DTO:', {
          raw: rawDto,
          transformed: transformedDto,
        });
        const mappedChecklist = this.mapChecklistDto(transformedDto);
        console.info('[ChecklistApi] Mapped checklist:', {
          originalCaseId: transformedDto.caseId,
          originalType: transformedDto.type,
          mappedEntityType: mappedChecklist.entityType,
          mappedName: mappedChecklist.name,
        });
        return mappedChecklist;
      });

      console.info('[ChecklistApi] Final mapped checklists:', mapped);
      return mapped;
    } catch (error) {
      // If 404 or empty response, return empty array
      if (
        error instanceof Error &&
        (error.message.includes('404') || error.message.includes('500'))
      ) {
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

  /**
   * Update checklist
   */
  async updateChecklist(
    id: string,
    data: {
      name?: string;
      entityType?: string;
      description?: string;
      items?: ChecklistItem[];
      isActive?: boolean;
    }
  ): Promise<Checklist> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists/${id}`;
    
    // Map frontend items to backend format
    const backendItems = data.items?.map((item, index) => ({
      id: item.id,
      name: item.description,
      description: item.description,
      category: item.category,
      isRequired: item.isRequired,
      order: index + 1,
      status: 'Pending',
      notes: item.guidelines || '',
    }));

    const payload = {
      type: data.entityType || 'Private Company',
      status: data.isActive ? 'Active' : 'Inactive',
      items: backendItems,
    };

    const dto = await this.request<ChecklistDto>(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    
    return this.mapChecklistDto(dto);
  }

  /**
   * Delete checklist
   */
  async deleteChecklist(id: string): Promise<void> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists/${id}`;
    
    await this.request<void>(url, {
      method: 'DELETE',
    });
  }
}

export const _checklistApiService = new ChecklistApiService();
export const checklistApiService = _checklistApiService;
