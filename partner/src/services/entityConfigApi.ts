// SECURITY: All API calls go through the proxy which injects tokens from Redis
// Use the proxy endpoint instead of direct API calls
const ENTITY_CONFIG_API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/proxy' // Use proxy endpoint in browser (tokens injected server-side)
  : (process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003');

// Types matching the backend DTOs
export interface EntityType {
  id: string;
  code: string;
  displayName: string;
  description: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  requirements?: EntityTypeRequirement[];
}

export interface EntityTypeRequirement {
  id: string;
  requirementId: string;
  isRequired: boolean;
  displayOrder: number;
  requirement?: Requirement;
}

export interface Requirement {
  id: string;
  code: string;
  displayName: string;
  description: string;
  type: string;
  fieldType: string;
  validationRules?: string;
  helpText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  options?: RequirementOption[];
}

export interface RequirementOption {
  id: string;
  value: string;
  displayText: string;
  displayOrder: number;
}

class EntityConfigApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Use direct /api/v1 path - gateway routing can be configured separately if needed
    // In browser, use proxy endpoint; server-side can use direct URL
    const basePath = '/api/v1';
    const url = typeof window !== 'undefined' 
      ? `${ENTITY_CONFIG_API_BASE_URL}${basePath}${endpoint}` // Proxy endpoint
      : `${ENTITY_CONFIG_API_BASE_URL}${basePath}${endpoint}`; // Direct URL (server-side)
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      // SECURITY: Include credentials to send session cookie (browser only)
      // Proxy will automatically inject Authorization header from Redis
      const fetchPromise = fetch(url, {
        ...options,
        credentials: typeof window !== 'undefined' ? 'include' : undefined, // Include session cookie in browser
        headers: {
          ...headers,
          ...options?.headers,
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Entity Config API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('timeout'))) {
        throw new Error('Unable to connect to Entity Configuration service');
      }
      throw error;
    }
  }

  // Entity Types endpoints
  async getEntityTypes(includeInactive = false, includeRequirements = false): Promise<EntityType[]> {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    if (includeRequirements) params.append('includeRequirements', 'true');
    
    const queryString = params.toString();
    return this.request<EntityType[]>(`/entitytypes${queryString ? `?${queryString}` : ''}`);
  }

  async getEntityType(id: string): Promise<EntityType> {
    return this.request<EntityType>(`/entitytypes/${id}`);
  }

  async getEntityTypeByCode(code: string, includeRequirements = true): Promise<EntityType | null> {
    try {
      const allTypes = await this.getEntityTypes(false, includeRequirements);
      return allTypes.find(et => et.code.toLowerCase() === code.toLowerCase()) || null;
    } catch (error) {
      console.error('Error fetching entity type by code:', error);
      return null;
    }
  }

  // Requirements endpoints
  async getRequirements(includeInactive = false): Promise<Requirement[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.request<Requirement[]>(`/requirements${params}`);
  }

  async getRequirement(id: string): Promise<Requirement> {
    return this.request<Requirement>(`/requirements/${id}`);
  }
}

export const entityConfigApiService = new EntityConfigApiService();

