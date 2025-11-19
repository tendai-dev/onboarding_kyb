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
    // Extract entity type from checklist type or case metadata
    const entityType = this.extractEntityType(dto.type);
    
    // Generate a display name from the type and case ID
    const name = `${entityType} Checklist`;
    
    // Generate description
    const description = `Checklist for ${entityType.toLowerCase()} onboarding`;
    
    // Map items
    const items: ChecklistItem[] = dto.items.map(item => ({
      id: item.id,
      description: item.description || item.name,
      isRequired: item.isRequired,
      category: item.category,
      order: item.order,
      guidelines: item.notes || undefined,
    }));

    return {
      id: dto.id,
      name,
      entityType,
      description,
      items,
      lastUpdated: dto.completedAt || dto.createdAt,
      isActive: dto.status !== 'Completed' && dto.status !== 'Cancelled',
      version: this.calculateVersion(dto.createdAt),
      createdBy: 'System', // Backend doesn't provide this, could be enhanced
    };
  }

  /**
   * Extract entity type from checklist type string
   */
  private extractEntityType(type: string): string {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes('PRIVATE') || typeUpper.includes('COMPANY')) {
      return 'Private Company';
    }
    if (typeUpper.includes('NPO') || typeUpper.includes('NONPROFIT')) {
      return 'NPO';
    }
    if (typeUpper.includes('GOVERNMENT') || typeUpper.includes('PUBLIC')) {
      return 'Government';
    }
    if (typeUpper.includes('PUBLICLY') || typeUpper.includes('LISTED')) {
      return 'Publicly Listed';
    }
    return 'Company'; // Default
  }

  /**
   * Calculate version from creation date
   */
  private calculateVersion(createdAt: string): string {
    const date = new Date(createdAt);
    const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    const major = Math.floor(daysSinceEpoch / 1000) + 1;
    const minor = (daysSinceEpoch % 100) / 10;
    return `${major}.${minor.toFixed(1)}`;
  }

  /**
   * Get all checklists
   */
  async getAllChecklists(): Promise<Checklist[]> {
    const url = `${CHECKLIST_API_BASE_URL}/api/checklist/checklists`;
    const dtos = await this.request<ChecklistDto[]>(url);
    
    // Map backend DTOs to frontend format
    return dtos.map(dto => this.mapChecklistDto(dto));
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

