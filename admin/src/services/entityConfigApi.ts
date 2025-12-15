// Removed unused import: getSession

const ENTITY_CONFIG_API_BASE_URL =
  process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8001';

// Entity Configuration API Service

// Types matching the backend DTOs
export interface EntityType {
  id: string;
  code: string;
  displayName: string;
  display_name?: string; // Backend returns snake_case
  description: string;
  icon?: string;
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
  updatedAt: string;
  updated_at?: string; // Backend returns snake_case
  requirements?: EntityTypeRequirement[];
}

export interface EntityTypeRequirement {
  id: string;
  requirementId: string;
  requirement_id?: string; // Backend returns snake_case
  isRequired: boolean;
  is_required?: boolean; // Backend returns snake_case
  displayOrder: number;
  display_order?: number; // Backend returns snake_case
  requirement?: Requirement;
}

export interface Requirement {
  id: string;
  code: string;
  displayName: string;
  display_name?: string; // Backend returns snake_case
  description: string;
  type: string;
  fieldType: string;
  field_type?: string; // Backend returns snake_case
  validationRules?: string;
  validation_rules?: string; // Backend returns snake_case
  helpText?: string;
  help_text?: string; // Backend returns snake_case
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
  updatedAt: string;
  updated_at?: string; // Backend returns snake_case
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
  entity_type_display_name?: string; // Backend returns snake_case
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
  updatedAt: string;
  updated_at?: string; // Backend returns snake_case
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

export const RequirementType = {
  Information: 1,
  Document: 2,
  ProofOfIdentity: 3,
  ProofOfAddress: 4,
  OwnershipStructure: 5,
  BoardDirectors: 6,
  AuthorizedSignatories: 7,
} as const;

export type RequirementType = (typeof RequirementType)[keyof typeof RequirementType];

export const FieldType = {
  Text: 'Text',
  Email: 'Email',
  Phone: 'Phone',
  Number: 'Number',
  Date: 'Date',
  Select: 'Select',
  MultiSelect: 'MultiSelect',
  Radio: 'Radio',
  Checkbox: 'Checkbox',
  Textarea: 'Textarea',
  File: 'File',
  Country: 'Country',
  Currency: 'Currency',
  Address: 'Address',
} as const;

export type FieldType = (typeof FieldType)[keyof typeof FieldType];

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
    // Use Next.js API route when in browser, direct URL when server-side
    let baseUrl: string;
    let finalEndpoint: string;

    if (typeof window !== 'undefined') {
      // Client-side: use Next.js API routes
      // Requirements endpoint uses dedicated route, entity-types and wizard configurations use entity-config
      if (endpoint.startsWith('/requirements')) {
        baseUrl = '/api/requirements';
        // Preserve sub-paths like /metadata, /by-code/xxx, etc.
        finalEndpoint = endpoint.replace('/requirements', '');
      } else if (
        endpoint.startsWith('/wizardconfigurations') ||
        endpoint.startsWith('/entity-types') ||
        endpoint.startsWith('/checklists')
      ) {
        baseUrl = '/api/entity-config';
        finalEndpoint = endpoint;
      } else {
        baseUrl = '/api/entity-config';
        finalEndpoint = endpoint;
      }
    } else {
      // Server-side: use direct backend URL
      baseUrl = `${ENTITY_CONFIG_API_BASE_URL}/api/v1`;
      finalEndpoint = endpoint;
    }

    const url = `${baseUrl}${finalEndpoint}`;
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
            errorMessage =
              errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
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
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes('timeout'))
      ) {
        throw new Error('Unable to connect to unified onboarding-api service');
      }
      throw error;
    }
  }

  // Entity Types endpoints
  async getEntityTypes(
    includeInactive = false,
    includeRequirements = true
  ): Promise<EntityType[]> {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    if (includeRequirements) params.append('includeRequirements', 'true');

    const queryString = params.toString();
    const data = await this.request<unknown[]>(
      `/entity-types${queryString ? `?${queryString}` : ''}`
    );

    // Transform snake_case or PascalCase to camelCase
    return data.map((et: unknown): EntityType => {
      const etObj = et as Record<string, unknown>;
      // Transform requirements array if present
      const requirements = (etObj.requirements || etObj.Requirements || []) as unknown[];
      let transformedRequirements: EntityTypeRequirement[] = [];
      if (Array.isArray(requirements) && requirements.length > 0) {
        transformedRequirements = requirements.map((req: unknown) => {
          const reqObj = req as Record<string, unknown>;

          // Backend returns requirement data as flat properties OR nested requirement object
          // Handle both cases - backend DTO flattens requirement properties
          const nestedRequirement = (reqObj.requirement || reqObj.Requirement) as
            | Requirement
            | undefined;
          const hasFlatData = !!(
            reqObj.code ||
            reqObj.Code ||
            reqObj.displayName ||
            reqObj.DisplayName ||
            reqObj.type ||
            reqObj.Type
          );

          // If we have flat data but no nested requirement, create a requirement object from flat properties
          let requirement: Requirement | undefined = nestedRequirement;
          if (!requirement && hasFlatData) {
            const valRules =
              reqObj.validationRules || reqObj.ValidationRules || reqObj.validation_rules;
            const helpTxt = reqObj.helpText || reqObj.HelpText || reqObj.help_text;
            requirement = {
              id: String(
                reqObj.requirementId ||
                  reqObj.RequirementId ||
                  reqObj.requirement_id ||
                  ''
              ),
              code: String(reqObj.code || reqObj.Code || ''),
              displayName: String(
                reqObj.displayName || reqObj.DisplayName || reqObj.display_name || ''
              ),
              description: String(reqObj.description || reqObj.Description || ''),
              type: String(reqObj.type || reqObj.Type || ''),
              fieldType: String(
                reqObj.fieldType || reqObj.FieldType || reqObj.field_type || 'text'
              ),
              validationRules: valRules ? String(valRules) : undefined,
              helpText: helpTxt ? String(helpTxt) : undefined,
              isActive:
                reqObj.isActive !== undefined
                  ? Boolean(reqObj.isActive)
                  : reqObj.is_active !== undefined
                    ? Boolean(reqObj.is_active)
                    : true,
              createdAt: String(
                reqObj.createdAt || reqObj.CreatedAt || reqObj.created_at || ''
              ),
              updatedAt: String(
                reqObj.updatedAt || reqObj.UpdatedAt || reqObj.updated_at || ''
              ),
            } as Requirement;
          }

          return {
            id: String(reqObj.id || reqObj.Id || ''),
            requirementId: String(
              reqObj.requirementId || reqObj.RequirementId || reqObj.requirement_id || ''
            ),
            isRequired:
              reqObj.isRequired !== undefined
                ? Boolean(reqObj.isRequired)
                : reqObj.IsRequired !== undefined
                  ? Boolean(reqObj.IsRequired)
                  : reqObj.is_required !== undefined
                    ? Boolean(reqObj.is_required)
                    : false,
            displayOrder: (reqObj.displayOrder ||
              reqObj.DisplayOrder ||
              reqObj.display_order ||
              0) as number,
            requirement: requirement,
          };
        });
      }

      return {
        id: String(etObj.id || etObj.Id || ''),
        code: String(etObj.code || etObj.Code || ''),
        displayName: String(
          etObj.displayName ||
            etObj.DisplayName ||
            etObj.display_name ||
            etObj.code ||
            'Unnamed'
        ),
        description: String(
          etObj.description || etObj.Description || etObj.description || ''
        ),
        icon: String(etObj.icon || etObj.Icon || ''),
        isActive:
          etObj.isActive !== undefined
            ? Boolean(etObj.isActive)
            : etObj.IsActive !== undefined
              ? Boolean(etObj.IsActive)
              : etObj.is_active !== undefined
                ? Boolean(etObj.is_active)
                : true,
        createdAt: String(etObj.createdAt || etObj.CreatedAt || etObj.created_at || ''),
        updatedAt: String(etObj.updatedAt || etObj.UpdatedAt || etObj.updated_at || ''),
        requirements: transformedRequirements,
      };
    });
  }

  async getEntityType(id: string, includeRequirements = true): Promise<EntityType> {
    const url = includeRequirements
      ? `/entity-types/${id}?includeRequirements=true`
      : `/entity-types/${id}`;
    return this.request<EntityType>(url);
  }

  async getEntityTypeByCode(
    code: string,
    includeRequirements = true
  ): Promise<EntityType | null> {
    // Use the code exactly as provided - no normalization
    // This is the code stored in the application metadata
    const cleanCode = code.trim();
    console.info(
      '[EntityConfigAPI] Fetching entity type by code (as-is from application):',
      cleanCode,
      'includeRequirements:',
      includeRequirements
    );

    // Use the new direct endpoint - NO FALLBACK
    try {
      const params = new URLSearchParams();
      if (includeRequirements) params.append('includeRequirements', 'true');
      const queryString = params.toString();

      const result = await this.request<unknown>(
        `/entity-types/by-code/${encodeURIComponent(cleanCode)}${queryString ? `?${queryString}` : ''}`
      );

      if (!result) {
        return null;
      }

      // Transform the response similar to getEntityTypes to handle snake_case/PascalCase
      const etObj = result as Record<string, unknown>;

      // Transform requirements array if present
      const requirements = (etObj.requirements || etObj.Requirements || []) as unknown[];
      let transformedRequirements: EntityTypeRequirement[] = [];
      if (Array.isArray(requirements) && requirements.length > 0) {
        transformedRequirements = requirements.map((req: unknown) => {
          const reqObj = req as Record<string, unknown>;

          // Backend returns requirement data as flat properties OR nested requirement object
          // Handle both cases - backend DTO flattens requirement properties
          const nestedRequirement = (reqObj.requirement || reqObj.Requirement) as
            | Requirement
            | undefined;
          const hasFlatData = !!(
            reqObj.code ||
            reqObj.Code ||
            reqObj.displayName ||
            reqObj.DisplayName ||
            reqObj.type ||
            reqObj.Type
          );

          // If we have flat data but no nested requirement, create a requirement object from flat properties
          let requirement: Requirement | undefined = nestedRequirement;
          if (!requirement && hasFlatData) {
            const valRules =
              reqObj.validationRules || reqObj.ValidationRules || reqObj.validation_rules;
            const helpTxt = reqObj.helpText || reqObj.HelpText || reqObj.help_text;
            requirement = {
              id: String(
                reqObj.requirementId ||
                  reqObj.RequirementId ||
                  reqObj.requirement_id ||
                  ''
              ),
              code: String(reqObj.code || reqObj.Code || ''),
              displayName: String(
                reqObj.displayName || reqObj.DisplayName || reqObj.display_name || ''
              ),
              description: String(reqObj.description || reqObj.Description || ''),
              type: String(reqObj.type || reqObj.Type || ''),
              fieldType: String(
                reqObj.fieldType || reqObj.FieldType || reqObj.field_type || 'text'
              ),
              validationRules: valRules ? String(valRules) : undefined,
              helpText: helpTxt ? String(helpTxt) : undefined,
              isActive:
                reqObj.isActive !== undefined
                  ? Boolean(reqObj.isActive)
                  : reqObj.is_active !== undefined
                    ? Boolean(reqObj.is_active)
                    : true,
              createdAt: String(
                reqObj.createdAt || reqObj.CreatedAt || reqObj.created_at || ''
              ),
              updatedAt: String(
                reqObj.updatedAt || reqObj.UpdatedAt || reqObj.updated_at || ''
              ),
            } as Requirement;
          }

          return {
            id: String(reqObj.id || reqObj.Id || ''),
            requirementId: String(
              reqObj.requirementId || reqObj.RequirementId || reqObj.requirement_id || ''
            ),
            isRequired:
              reqObj.isRequired !== undefined
                ? Boolean(reqObj.isRequired)
                : reqObj.IsRequired !== undefined
                  ? Boolean(reqObj.IsRequired)
                  : reqObj.is_required !== undefined
                    ? Boolean(reqObj.is_required)
                    : false,
            displayOrder: (reqObj.displayOrder ||
              reqObj.DisplayOrder ||
              reqObj.display_order ||
              0) as number,
            requirement: requirement,
          };
        });
      }

      const transformedResult: EntityType = {
        id: String(etObj.id || etObj.Id || ''),
        code: String(etObj.code || etObj.Code || ''),
        displayName: String(
          etObj.displayName ||
            etObj.DisplayName ||
            etObj.display_name ||
            etObj.code ||
            'Unnamed'
        ),
        description: String(
          etObj.description || etObj.Description || etObj.description || ''
        ),
        icon: String(etObj.icon || etObj.Icon || ''),
        isActive:
          etObj.isActive !== undefined
            ? Boolean(etObj.isActive)
            : etObj.IsActive !== undefined
              ? Boolean(etObj.IsActive)
              : etObj.is_active !== undefined
                ? Boolean(etObj.is_active)
                : true,
        createdAt: String(etObj.createdAt || etObj.CreatedAt || etObj.created_at || ''),
        updatedAt: String(etObj.updatedAt || etObj.UpdatedAt || etObj.updated_at || ''),
        requirements: transformedRequirements,
      };

      console.info(
        '[EntityConfigAPI] ✅ Successfully fetched entity type:',
        transformedResult.code,
        `with ${transformedRequirements.length} requirements`
      );
      return transformedResult;
    } catch (error) {
      if (typeof window !== 'undefined') {
        const { clientSentry } = await import('../lib/sentry-client');
        clientSentry.reportError(error, {
          tags: {
            error_type: 'entity_config_api',
            operation: 'fetch_entity_type_by_code',
          },
          extra: { code: cleanCode },
          level: 'error',
        });
      }
      return null;
    }
  }

  async createEntityType(data: {
    code: string;
    displayName: string;
    description: string;
    icon?: string;
  }): Promise<{ id: string; code: string; displayName: string }> {
    // Convert to snake_case for backend (backend accepts both but prefers snake_case)
    const payload = {
      code: data.code,
      display_name: data.displayName,
      description: data.description,
      icon: data.icon,
    };
    return this.request<{ id: string; code: string; displayName: string }>(
      '/entity-types',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async updateEntityType(
    id: string,
    data: { displayName: string; description: string; isActive: boolean; icon?: string }
  ): Promise<unknown> {
    // Convert to snake_case for backend
    const payload = {
      display_name: data.displayName,
      description: data.description,
      is_active: data.isActive,
      icon: data.icon,
    };
    return this.request<unknown>(`/entity-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteEntityType(id: string): Promise<void> {
    return this.request<void>(`/entity-types/${id}`, {
      method: 'DELETE',
    });
  }

  // Requirements endpoints
  async getRequirements(includeInactive = false): Promise<Requirement[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const data = await this.request<unknown[]>(`/requirements${params}`);

    // Transform snake_case or PascalCase to camelCase
    return data.map((req: unknown): Requirement => {
      const reqObj = req as Record<string, unknown>;
      return {
        id: String(reqObj.id || reqObj.Id || ''),
        code: String(reqObj.code || reqObj.Code || ''),
        displayName: String(
          reqObj.displayName ||
            reqObj.DisplayName ||
            reqObj.display_name ||
            reqObj.code ||
            'Unnamed'
        ),
        description: String(
          reqObj.description || reqObj.Description || reqObj.description || ''
        ),
        type: String(reqObj.type || reqObj.Type || reqObj.type || ''),
        fieldType: String(
          reqObj.fieldType || reqObj.FieldType || reqObj.field_type || ''
        ),
        validationRules:
          reqObj.validationRules || reqObj.ValidationRules || reqObj.validation_rules
            ? String(
                reqObj.validationRules ||
                  reqObj.ValidationRules ||
                  reqObj.validation_rules
              )
            : undefined,
        helpText: String(reqObj.helpText || reqObj.HelpText || reqObj.help_text || ''),
        isActive:
          reqObj.isActive !== undefined
            ? Boolean(reqObj.isActive)
            : reqObj.IsActive !== undefined
              ? Boolean(reqObj.IsActive)
              : reqObj.is_active !== undefined
                ? Boolean(reqObj.is_active)
                : true,
        createdAt: String(
          reqObj.createdAt || reqObj.CreatedAt || reqObj.created_at || ''
        ),
        updatedAt: String(
          reqObj.updatedAt || reqObj.UpdatedAt || reqObj.updated_at || ''
        ),
        options: Array.isArray(reqObj.options || reqObj.Options)
          ? ((reqObj.options || reqObj.Options) as unknown[]).map((opt: unknown) => {
              const optObj = opt as Record<string, unknown>;
              return {
                id: String(optObj.id || optObj.Id || ''),
                value: String(optObj.value || optObj.Value || ''),
                displayText: String(
                  optObj.displayText || optObj.DisplayText || optObj.display_text || ''
                ),
                displayOrder:
                  typeof optObj.displayOrder === 'number'
                    ? optObj.displayOrder
                    : typeof optObj.DisplayOrder === 'number'
                      ? optObj.DisplayOrder
                      : typeof optObj.display_order === 'number'
                        ? optObj.display_order
                        : 0,
              };
            })
          : [],
      };
    });
  }

  async getRequirement(id: string): Promise<Requirement> {
    return this.request<Requirement>(`/requirements/${id}`);
  }

  async createRequirement(data: CreateRequirementRequest): Promise<unknown> {
    return this.request<unknown>('/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRequirement(id: string, data: UpdateRequirementRequest): Promise<unknown> {
    return this.request<unknown>(`/requirements/${id}`, {
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

  async addRequirementOption(
    requirementId: string,
    data: { value: string; displayText: string; displayOrder: number }
  ): Promise<RequirementOption> {
    return this.request<RequirementOption>(`/requirements/${requirementId}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRequirementOption(
    requirementId: string,
    optionId: string,
    data: { value: string; displayText: string; displayOrder: number }
  ): Promise<RequirementOption> {
    return this.request<RequirementOption>(
      `/requirements/${requirementId}/options/${optionId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteRequirementOption(requirementId: string, optionId: string): Promise<void> {
    return this.request<void>(`/requirements/${requirementId}/options/${optionId}`, {
      method: 'DELETE',
    });
  }

  // Entity Type Requirements endpoints
  async addRequirementToEntityType(
    entityTypeId: string,
    data: { requirementId: string; isRequired: boolean; displayOrder: number }
  ): Promise<void> {
    // Backend expects camelCase for this endpoint (has explicit JsonPropertyName attributes)
    return this.request<void>(`/entity-types/${entityTypeId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeRequirementFromEntityType(
    entityTypeId: string,
    requirementId: string
  ): Promise<void> {
    return this.request<void>(
      `/entity-types/${entityTypeId}/requirements/${requirementId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Wizard Configuration endpoints
  async getWizardConfigurations(includeInactive = false): Promise<WizardConfiguration[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const data = await this.request<unknown[]>(`/wizardconfigurations${params}`);
    // Transform snake_case to camelCase
    return data.map((config: unknown): WizardConfiguration => {
      const configObj = config as Record<string, unknown>;
      return {
        id: String(configObj.id || ''),
        entityTypeId: String(configObj.entity_type_id || configObj.entityTypeId || ''),
        entityTypeDisplayName: String(
          configObj.entity_type_display_name || configObj.entityTypeDisplayName || ''
        ),
        isActive:
          configObj.is_active !== undefined
            ? Boolean(configObj.is_active)
            : Boolean(configObj.isActive),
        createdAt: String(configObj.created_at || configObj.createdAt || ''),
        updatedAt: String(configObj.updated_at || configObj.updatedAt || ''),
        steps: Array.isArray(configObj.steps)
          ? (configObj.steps as unknown[]).map((step: unknown) => {
              const stepObj = step as Record<string, unknown>;

              // Backend returns requirementTypes as JSON string, parse it
              let requirementTypes: string[] = [];
              const reqTypesRaw =
                stepObj.requirement_types ||
                stepObj.requirementTypes ||
                stepObj.RequirementTypes;

              if (typeof reqTypesRaw === 'string') {
                try {
                  // Try parsing as JSON string
                  requirementTypes = JSON.parse(reqTypesRaw);
                } catch {
                  // If not valid JSON, treat as comma-separated or single value
                  requirementTypes = reqTypesRaw
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                }
              } else if (Array.isArray(reqTypesRaw)) {
                requirementTypes = reqTypesRaw;
              }

              return {
                id: String(stepObj.id || ''),
                title: String(stepObj.title || ''),
                subtitle: String(stepObj.subtitle || ''),
                requirementTypes: requirementTypes,
                checklistCategory: String(
                  stepObj.checklist_category || stepObj.checklistCategory || ''
                ),
                stepNumber: (stepObj.step_number || stepObj.stepNumber || 0) as number,
                isActive:
                  stepObj.is_active !== undefined
                    ? Boolean(stepObj.is_active)
                    : Boolean(stepObj.isActive),
              };
            })
          : [],
      };
    });
  }

  async getWizardConfiguration(id: string): Promise<WizardConfiguration> {
    const config = await this.request<unknown>(`/wizardconfigurations/${id}`);
    const configObj = config as Record<string, unknown>;
    // Transform snake_case to camelCase
    return {
      id: String(configObj.id || ''),
      entityTypeId: String(configObj.entity_type_id || configObj.entityTypeId || ''),
      entityTypeDisplayName: String(
        configObj.entity_type_display_name || configObj.entityTypeDisplayName || ''
      ),
      isActive:
        configObj.is_active !== undefined
          ? Boolean(configObj.is_active)
          : Boolean(configObj.isActive),
      createdAt: String(configObj.created_at || configObj.createdAt || ''),
      updatedAt: String(configObj.updated_at || configObj.updatedAt || ''),
      steps: ((configObj.steps || []) as unknown[]).map((step: unknown) => {
        const stepObj = step as Record<string, unknown>;

        // Backend returns requirementTypes as JSON string, parse it
        let requirementTypes: string[] = [];
        const reqTypesRaw =
          stepObj.requirement_types ||
          stepObj.requirementTypes ||
          stepObj.RequirementTypes;

        if (typeof reqTypesRaw === 'string') {
          try {
            // Try parsing as JSON string
            requirementTypes = JSON.parse(reqTypesRaw);
          } catch {
            // If not valid JSON, treat as comma-separated or single value
            requirementTypes = reqTypesRaw
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
        } else if (Array.isArray(reqTypesRaw)) {
          requirementTypes = reqTypesRaw;
        }

        return {
          id: stepObj.id as string,
          title: stepObj.title as string,
          subtitle: (stepObj.subtitle ? String(stepObj.subtitle) : '') as string,
          requirementTypes: requirementTypes,
          checklistCategory: String(
            stepObj.checklist_category || stepObj.checklistCategory || ''
          ),
          stepNumber: (stepObj.step_number || stepObj.stepNumber || 0) as number,
          isActive:
            stepObj.is_active !== undefined
              ? Boolean(stepObj.is_active)
              : Boolean(stepObj.isActive),
        };
      }),
    };
  }

  async getWizardConfigurationByEntityType(
    entityTypeId: string
  ): Promise<WizardConfiguration | null> {
    try {
      const config = await this.request<unknown>(
        `/wizardconfigurations/by-entity-type/${entityTypeId}`
      );

      if (!config) return null;

      const configObj = config as Record<string, unknown>;

      // Transform snake_case to camelCase and parse requirementTypes
      return {
        id: String(configObj.id || ''),
        entityTypeId: String(configObj.entity_type_id || configObj.entityTypeId || ''),
        entityTypeDisplayName: String(
          configObj.entity_type_display_name || configObj.entityTypeDisplayName || ''
        ),
        isActive:
          configObj.is_active !== undefined
            ? Boolean(configObj.is_active)
            : Boolean(configObj.isActive),
        createdAt: String(configObj.created_at || configObj.createdAt || ''),
        updatedAt: String(configObj.updated_at || configObj.updatedAt || ''),
        steps: ((configObj.steps || []) as unknown[]).map((step: unknown) => {
          const stepObj = step as Record<string, unknown>;

          // Backend returns requirementTypes as JSON string, parse it
          let requirementTypes: string[] = [];
          const reqTypesRaw =
            stepObj.requirement_types ||
            stepObj.requirementTypes ||
            stepObj.RequirementTypes;

          if (typeof reqTypesRaw === 'string') {
            try {
              // Try parsing as JSON string
              requirementTypes = JSON.parse(reqTypesRaw);
            } catch {
              // If not valid JSON, treat as comma-separated or single value
              requirementTypes = reqTypesRaw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean);
            }
          } else if (Array.isArray(reqTypesRaw)) {
            requirementTypes = reqTypesRaw;
          }

          return {
            id: String(stepObj.id || ''),
            title: String(stepObj.title || ''),
            subtitle: String(stepObj.subtitle || ''),
            requirementTypes: requirementTypes,
            checklistCategory: String(
              stepObj.checklist_category || stepObj.checklistCategory || ''
            ),
            stepNumber: (stepObj.step_number || stepObj.stepNumber || 0) as number,
            isActive:
              stepObj.is_active !== undefined
                ? Boolean(stepObj.is_active)
                : Boolean(stepObj.isActive),
          };
        }),
      };
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

  async createWizardConfiguration(
    data: CreateWizardConfigurationRequest
  ): Promise<{ id: string; entityTypeId: string; isActive: boolean; createdAt: string }> {
    return this.request<{
      id: string;
      entityTypeId: string;
      isActive: boolean;
      createdAt: string;
    }>('/wizardconfigurations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWizardConfiguration(
    id: string,
    data: UpdateWizardConfigurationRequest
  ): Promise<unknown> {
    return this.request<unknown>(`/wizardconfigurations/${id}`, {
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

export const _entityConfigApiService = new EntityConfigApiService();
export const entityConfigApiService = _entityConfigApiService;
