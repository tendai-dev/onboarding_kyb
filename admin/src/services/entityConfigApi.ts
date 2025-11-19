import { getSession } from 'next-auth/react';

const ENTITY_CONFIG_API_BASE_URL = process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';

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

export interface CreateRequirementRequest {
  code: string;
  displayName: string;
  description: string;
  type: RequirementType;
  fieldType: FieldType;
  validationRules?: string;
  helpText?: string;
}

export interface UpdateRequirementRequest {
  displayName: string;
  description: string;
  validationRules?: string;
  helpText?: string;
  isActive: boolean;
}

export interface RequirementsMetadata {
  requirementTypes: RequirementTypeMetadata[];
  fieldTypes: FieldTypeMetadata[];
}

export interface RequirementTypeMetadata {
  value: number;
  label: string;
}

export interface FieldTypeMetadata {
  value: string;
  label: string;
}

export interface WizardConfiguration {
  id: string;
  entityTypeId: string;
  entityTypeDisplayName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps: WizardStep[];
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  requirementTypes: string[];
  checklistCategory: string;
  stepNumber: number;
  isActive: boolean;
}

export interface CreateWizardConfigurationRequest {
  entityTypeId: string;
  isActive: boolean;
  steps: CreateWizardStepRequest[];
}

export interface CreateWizardStepRequest {
  title: string;
  subtitle: string;
  requirementTypes: string[];
  checklistCategory: string;
  stepNumber: number;
  isActive: boolean;
}

export interface UpdateWizardConfigurationRequest {
  isActive: boolean;
  steps: CreateWizardStepRequest[];
}

export enum RequirementType {
  Information = 1,
  Document = 2,
  ProofOfIdentity = 3,
  ProofOfAddress = 4,
  OwnershipStructure = 5,
  BoardDirectors = 6,
  AuthorizedSignatories = 7
}

export enum FieldType {
  Text = 'Text',
  Email = 'Email',
  Phone = 'Phone',
  Number = 'Number',
  Date = 'Date',
  Select = 'Select',
  MultiSelect = 'MultiSelect',
  Radio = 'Radio',
  Checkbox = 'Checkbox',
  Textarea = 'Textarea',
  File = 'File',
  Country = 'Country',
  Currency = 'Currency',
  Address = 'Address'
}

class EntityConfigApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
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
      } catch (error) {
        if (typeof window !== 'undefined') {
          const { clientSentry } = await import('../lib/sentry-client');
          clientSentry.reportError(error, {
            tags: { error_type: 'entity_config_api', operation: 'get_session' },
            level: 'warning',
          });
        }
      }
    }
    // Server-side: API proxy will inject token from Redis, no need to add here

    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${ENTITY_CONFIG_API_BASE_URL}/api/v1${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
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
        let errorMessage = `Entity Config API request failed: ${response.status} ${response.statusText}`;
        
        // Try to parse error message from JSON response
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // If not JSON, use the text as is (may contain HTML or plain text)
          if (errorText && errorText.trim().length > 0) {
            errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
          }
        }
        
        throw new Error(errorMessage);
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
  async getEntityTypes(includeInactive = false, includeRequirements = true): Promise<EntityType[]> {
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
    // Use the code exactly as provided - no normalization
    // This is the code stored in the application metadata
    const cleanCode = code.trim();
    console.log('[EntityConfigAPI] Fetching entity type by code (as-is from application):', cleanCode);
    
    // Use the new direct endpoint - NO FALLBACK
    try {
      const result = await this.request<EntityType>(`/entitytypes/by-code/${encodeURIComponent(cleanCode)}`);
      console.log('[EntityConfigAPI] ✅ Successfully fetched entity type:', result?.code);
      return result;
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('../lib/sentry-client');
        clientSentry.reportError(error, {
          tags: { error_type: 'entity_config_api', operation: 'fetch_entity_type_by_code' },
          extra: { code: cleanCode },
          level: 'error',
        });
      }
      return null;
    }
  }

  async createEntityType(data: { code: string; displayName: string; description: string; icon?: string }): Promise<{ id: string; code: string; displayName: string }> {
    return this.request<{ id: string; code: string; displayName: string }>('/entitytypes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntityType(id: string, data: { displayName: string; description: string; isActive: boolean; icon?: string }): Promise<any> {
    return this.request<any>(`/entitytypes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntityType(id: string): Promise<void> {
    return this.request<void>(`/entitytypes/${id}`, {
      method: 'DELETE',
    });
  }

  // Requirements endpoints
  async getRequirements(includeInactive = false): Promise<Requirement[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.request<Requirement[]>(`/requirements${params}`);
  }

  async getRequirement(id: string): Promise<Requirement> {
    return this.request<Requirement>(`/requirements/${id}`);
  }

  async createRequirement(data: CreateRequirementRequest): Promise<any> {
    return this.request<any>('/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRequirement(id: string, data: UpdateRequirementRequest): Promise<any> {
    return this.request<any>(`/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRequirement(id: string): Promise<void> {
    return this.request<void>(`/requirements/${id}`, {
      method: 'DELETE',
    });
  }

  async getRequirementsMetadata(): Promise<RequirementsMetadata> {
    return this.request<RequirementsMetadata>('/requirements/metadata');
  }

  // Requirement Options endpoints
  async getRequirementOptions(requirementId: string): Promise<RequirementOption[]> {
    return this.request<RequirementOption[]>(`/requirements/${requirementId}/options`);
  }

  async addRequirementOption(requirementId: string, data: { value: string; displayText: string; displayOrder: number }): Promise<RequirementOption> {
    return this.request<RequirementOption>(`/requirements/${requirementId}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRequirementOption(requirementId: string, optionId: string, data: { value: string; displayText: string; displayOrder: number }): Promise<RequirementOption> {
    return this.request<RequirementOption>(`/requirements/${requirementId}/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRequirementOption(requirementId: string, optionId: string): Promise<void> {
    return this.request<void>(`/requirements/${requirementId}/options/${optionId}`, {
      method: 'DELETE',
    });
  }

  // Entity Type Requirements endpoints
  async addRequirementToEntityType(entityTypeId: string, data: { requirementId: string; isRequired: boolean; displayOrder: number }): Promise<void> {
    return this.request<void>(`/entitytypes/${entityTypeId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeRequirementFromEntityType(entityTypeId: string, requirementId: string): Promise<void> {
    return this.request<void>(`/entitytypes/${entityTypeId}/requirements/${requirementId}`, {
      method: 'DELETE',
    });
  }

  // Wizard Configuration endpoints
  async getWizardConfigurations(includeInactive = false): Promise<WizardConfiguration[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.request<WizardConfiguration[]>(`/wizardconfigurations${params}`);
  }

  async getWizardConfiguration(id: string): Promise<WizardConfiguration> {
    return this.request<WizardConfiguration>(`/wizardconfigurations/${id}`);
  }

  async getWizardConfigurationByEntityType(entityTypeId: string): Promise<WizardConfiguration | null> {
    try {
      return this.request<WizardConfiguration>(`/wizardconfigurations/by-entity-type/${entityTypeId}`);
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('../lib/sentry-client');
        clientSentry.reportError(error, {
          tags: { error_type: 'entity_config_api', operation: 'fetch_wizard_config' },
          extra: { entityTypeId },
          level: 'error',
        });
      }
      return null;
    }
  }

  async createWizardConfiguration(data: CreateWizardConfigurationRequest): Promise<{ id: string; entityTypeId: string; isActive: boolean; createdAt: string }> {
    return this.request<{ id: string; entityTypeId: string; isActive: boolean; createdAt: string }>('/wizardconfigurations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWizardConfiguration(id: string, data: UpdateWizardConfigurationRequest): Promise<any> {
    return this.request<any>(`/wizardconfigurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWizardConfiguration(id: string): Promise<void> {
    return this.request<void>(`/wizardconfigurations/${id}`, {
      method: 'DELETE',
    });
  }
}

export const entityConfigApiService = new EntityConfigApiService();

