const COUNTRY_CONFIG_API_BASE_URL =
  process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8001';

// Country Configuration API Service

// Types matching the backend DTOs
export interface CountryProfile {
  id: string;
  countryCode: string;
  countryName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  entityTypeOverrides: CountryEntityTypeOverride[];
  terminologyOverrides: CountryTerminologyOverride[];
  formBundles: CountryFormBundle[];
  fieldVisibilityRules: CountryFieldVisibilityRule[];
  complianceToggles: CountryComplianceToggle[];
  tags: ConfigurationTag[];
}

export interface CountryEntityTypeOverride {
  id: string;
  entityTypeId: string;
  isEnabled: boolean;
  customDisplayName?: string;
  customDescription?: string;
  displayOrder: number;
}

export interface CountryTerminologyOverride {
  id: string;
  targetType: string;
  targetCode: string;
  overrideDisplayName?: string;
  overrideDescription?: string;
  overrideHelpText?: string;
  overridePlaceholder?: string;
}

export interface CountryFormBundle {
  id: string;
  entityTypeId?: string;
  bundleName: string;
  description?: string;
  isActive: boolean;
  fieldConfigurationJson: string;
}

export interface CountryFieldVisibilityRule {
  id: string;
  targetFieldCode: string;
  entityTypeId?: string;
  ruleExpression: string;
  isVisible: boolean;
  priority: number;
  isActive: boolean;
}

export interface CountryComplianceToggle {
  id: string;
  complianceCode: string;
  complianceName: string;
  description?: string;
  isEnabled: boolean;
  configurationJson?: string;
}

export interface ConfigurationTag {
  id: string;
  tagName: string;
  tagValue?: string;
}

// Request DTOs
export interface CreateCountryProfileRequest {
  countryCode: string;
  countryName: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateCountryProfileRequest {
  countryName: string;
  description?: string;
  updatedBy?: string;
}

export interface AddEntityTypeOverrideRequest {
  entityTypeId: string;
  isEnabled?: boolean;
  customDisplayName?: string;
  customDescription?: string;
  displayOrder?: number;
}

export interface AddTerminologyOverrideRequest {
  targetType: string;
  targetCode: string;
  overrideDisplayName?: string;
  overrideDescription?: string;
  overrideHelpText?: string;
  overridePlaceholder?: string;
}

export interface CreateFormBundleRequest {
  bundleName: string;
  fieldConfigurationJson: string;
  entityTypeId?: string;
  description?: string;
}

export interface AddFieldVisibilityRuleRequest {
  targetFieldCode: string;
  ruleExpression: string;
  isVisible?: boolean;
  entityTypeId?: string;
  priority?: number;
}

export interface AddComplianceToggleRequest {
  complianceCode: string;
  complianceName: string;
  isEnabled?: boolean;
  description?: string;
  configurationJson?: string;
}

export interface AddTagRequest {
  tagName: string;
  tagValue?: string;
}

class CountryConfigApiService {
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
            tags: { error_type: 'country_config_api', operation: 'get_session' },
            level: 'warning',
          });
        }
      }
    }
    // Server-side: API proxy will inject token from Redis, no need to add here

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Use Next.js API route when in browser, direct URL when server-side
    let baseUrl: string;
    let finalEndpoint: string;

    if (typeof window !== 'undefined') {
      // Client-side: use Next.js API proxy route
      baseUrl = '/api/proxy';
      finalEndpoint = `/api/v1/country-configurations${endpoint}`;
    } else {
      // Server-side: use direct backend URL
      baseUrl = `${COUNTRY_CONFIG_API_BASE_URL}/api/v1/country-configurations`;
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
          ...options.headers,
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Country Config API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // Use the text as-is if not JSON
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

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // Country Profile methods
  async getCountryProfiles(includeInactive = false): Promise<CountryProfile[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const data = await this.request<unknown[]>(params);
    return this.transformCountryProfiles(data);
  }

  async getCountryProfile(id: string): Promise<CountryProfile> {
    const data = await this.request<unknown>(`/${id}`);
    return this.transformCountryProfile(data as Record<string, unknown>);
  }

  async getCountryProfileByCode(countryCode: string): Promise<CountryProfile> {
    const data = await this.request<unknown>(`/by-code/${countryCode}`);
    return this.transformCountryProfile(data as Record<string, unknown>);
  }

  async createCountryProfile(
    request: CreateCountryProfileRequest
  ): Promise<CountryProfile> {
    const data = await this.request<unknown>('', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return this.transformCountryProfile(data as Record<string, unknown>);
  }

  async updateCountryProfile(
    id: string,
    request: UpdateCountryProfileRequest
  ): Promise<CountryProfile> {
    const data = await this.request<unknown>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return this.transformCountryProfile(data as Record<string, unknown>);
  }

  async deleteCountryProfile(id: string): Promise<void> {
    await this.request(`/${id}`, {
      method: 'DELETE',
    });
  }

  async activateCountryProfile(id: string): Promise<void> {
    await this.request(`/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateCountryProfile(id: string): Promise<void> {
    await this.request(`/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // Entity Type Override methods
  async addEntityTypeOverride(
    countryProfileId: string,
    request: AddEntityTypeOverrideRequest
  ): Promise<void> {
    await this.request(`/${countryProfileId}/entity-type-overrides`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateEntityTypeOverride(
    countryProfileId: string,
    entityTypeId: string,
    request: AddEntityTypeOverrideRequest
  ): Promise<void> {
    await this.request(`/${countryProfileId}/entity-type-overrides/${entityTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async removeEntityTypeOverride(
    countryProfileId: string,
    entityTypeId: string
  ): Promise<void> {
    await this.request(`/${countryProfileId}/entity-type-overrides/${entityTypeId}`, {
      method: 'DELETE',
    });
  }

  // Terminology Override methods
  async addTerminologyOverride(
    countryProfileId: string,
    request: AddTerminologyOverrideRequest
  ): Promise<string> {
    const response = await this.request<{ overrideId: string }>(
      `/${countryProfileId}/terminology-overrides`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response.overrideId;
  }

  async removeTerminologyOverride(overrideId: string): Promise<void> {
    await this.request(`/terminology-overrides/${overrideId}`, {
      method: 'DELETE',
    });
  }

  // Form Bundle methods
  async createFormBundle(
    countryProfileId: string,
    request: CreateFormBundleRequest
  ): Promise<CountryFormBundle> {
    const data = await this.request<unknown>(`/${countryProfileId}/form-bundles`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return this.transformFormBundle(data as Record<string, unknown>);
  }

  async deleteFormBundle(bundleId: string): Promise<void> {
    await this.request(`/form-bundles/${bundleId}`, {
      method: 'DELETE',
    });
  }

  // Field Visibility Rule methods
  async addFieldVisibilityRule(
    countryProfileId: string,
    request: AddFieldVisibilityRuleRequest
  ): Promise<string> {
    const response = await this.request<{ ruleId: string }>(
      `/${countryProfileId}/field-visibility-rules`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response.ruleId;
  }

  async removeFieldVisibilityRule(ruleId: string): Promise<void> {
    await this.request(`/field-visibility-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // Compliance Toggle methods
  async addComplianceToggle(
    countryProfileId: string,
    request: AddComplianceToggleRequest
  ): Promise<void> {
    await this.request(`/${countryProfileId}/compliance-toggles`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateComplianceToggle(
    countryProfileId: string,
    complianceCode: string,
    request: AddComplianceToggleRequest
  ): Promise<void> {
    await this.request(`/${countryProfileId}/compliance-toggles/${complianceCode}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async removeComplianceToggle(
    countryProfileId: string,
    complianceCode: string
  ): Promise<void> {
    await this.request(`/${countryProfileId}/compliance-toggles/${complianceCode}`, {
      method: 'DELETE',
    });
  }

  // Tag methods
  async addTag(countryProfileId: string, request: AddTagRequest): Promise<void> {
    await this.request(`/${countryProfileId}/tags`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async removeTag(
    countryProfileId: string,
    tagName: string,
    tagValue?: string
  ): Promise<void> {
    const params = tagValue
      ? `?tagName=${tagName}&tagValue=${tagValue}`
      : `?tagName=${tagName}`;
    await this.request(`/${countryProfileId}/tags${params}`, {
      method: 'DELETE',
    });
  }

  // Transform methods to handle snake_case to camelCase conversion
  private transformCountryProfiles(data: unknown[]): CountryProfile[] {
    return data.map((item) =>
      this.transformCountryProfile(item as Record<string, unknown>)
    );
  }

  private transformCountryProfile(data: Record<string, unknown>): CountryProfile {
    return {
      id: String(data.id || ''),
      countryCode: String(data.country_code || data.countryCode || ''),
      countryName: String(data.country_name || data.countryName || ''),
      description: data.description ? String(data.description) : undefined,
      isActive: Boolean(data.is_active ?? data.isActive ?? true),
      createdAt: String(data.created_at || data.createdAt || ''),
      updatedAt: String(data.updated_at || data.updatedAt || ''),
      createdBy: String(data.created_by || data.createdBy || ''),
      updatedBy:
        data.updated_by || data.updatedBy
          ? String(
              (data as Record<string, unknown>).updated_by ||
                (data as Record<string, unknown>).updatedBy
            )
          : undefined,
      entityTypeOverrides: (() => {
        const dataObj = data as Record<string, unknown>;
        const overrides = dataObj.entity_type_overrides || dataObj.entityTypeOverrides;
        return Array.isArray(overrides)
          ? (overrides as unknown[]).map((o: unknown) =>
              this.transformEntityTypeOverride(o as Record<string, unknown>)
            )
          : [];
      })(),
      terminologyOverrides: (() => {
        const dataObj = data as Record<string, unknown>;
        const overrides = dataObj.terminology_overrides || dataObj.terminologyOverrides;
        return Array.isArray(overrides)
          ? (overrides as unknown[]).map((o: unknown) =>
              this.transformTerminologyOverride(o as Record<string, unknown>)
            )
          : [];
      })(),
      formBundles: (() => {
        const dataObj = data as Record<string, unknown>;
        const bundles = dataObj.form_bundles || dataObj.formBundles;
        return Array.isArray(bundles)
          ? (bundles as unknown[]).map((b: unknown) =>
              this.transformFormBundle(b as Record<string, unknown>)
            )
          : [];
      })(),
      fieldVisibilityRules: (() => {
        const dataObj = data as Record<string, unknown>;
        const rules = dataObj.field_visibility_rules || dataObj.fieldVisibilityRules;
        return Array.isArray(rules)
          ? (rules as unknown[]).map((r: unknown) =>
              this.transformFieldVisibilityRule(r as Record<string, unknown>)
            )
          : [];
      })(),
      complianceToggles: (() => {
        const dataObj = data as Record<string, unknown>;
        const toggles = dataObj.compliance_toggles || dataObj.complianceToggles;
        return Array.isArray(toggles)
          ? (toggles as unknown[]).map((t: unknown) =>
              this.transformComplianceToggle(t as Record<string, unknown>)
            )
          : [];
      })(),
      tags: (() => {
        const dataObj = data as Record<string, unknown>;
        const tags = dataObj.tags;
        return Array.isArray(tags)
          ? (tags as unknown[]).map((t: unknown) =>
              this.transformTag(t as Record<string, unknown>)
            )
          : [];
      })(),
    };
  }

  private transformEntityTypeOverride(
    data: Record<string, unknown>
  ): CountryEntityTypeOverride {
    return {
      id: String(data.id || ''),
      entityTypeId: String(data.entity_type_id || data.entityTypeId || ''),
      isEnabled: Boolean(data.is_enabled ?? data.isEnabled ?? true),
      customDisplayName:
        data.custom_display_name || data.customDisplayName
          ? String(data.custom_display_name || data.customDisplayName)
          : undefined,
      customDescription:
        data.custom_description || data.customDescription
          ? String(data.custom_description || data.customDescription)
          : undefined,
      displayOrder: Number(data.display_order || data.displayOrder || 0),
    };
  }

  private transformTerminologyOverride(
    data: Record<string, unknown>
  ): CountryTerminologyOverride {
    return {
      id: String(data.id || ''),
      targetType: String(data.target_type || data.targetType || ''),
      targetCode: String(data.target_code || data.targetCode || ''),
      overrideDisplayName:
        data.override_display_name || data.overrideDisplayName
          ? String(data.override_display_name || data.overrideDisplayName)
          : undefined,
      overrideDescription:
        data.override_description || data.overrideDescription
          ? String(data.override_description || data.overrideDescription)
          : undefined,
      overrideHelpText:
        data.override_help_text || data.overrideHelpText
          ? String(data.override_help_text || data.overrideHelpText)
          : undefined,
      overridePlaceholder:
        data.override_placeholder || data.overridePlaceholder
          ? String(data.override_placeholder || data.overridePlaceholder)
          : undefined,
    };
  }

  private transformFormBundle(data: Record<string, unknown>): CountryFormBundle {
    return {
      id: String(data.id || ''),
      entityTypeId:
        data.entity_type_id || data.entityTypeId
          ? String(data.entity_type_id || data.entityTypeId)
          : undefined,
      bundleName: String(data.bundle_name || data.bundleName || ''),
      description: data.description ? String(data.description) : undefined,
      isActive: Boolean(data.is_active ?? data.isActive ?? true),
      fieldConfigurationJson: String(
        data.field_configuration_json || data.fieldConfigurationJson || ''
      ),
    };
  }

  private transformFieldVisibilityRule(
    data: Record<string, unknown>
  ): CountryFieldVisibilityRule {
    return {
      id: String(data.id || ''),
      targetFieldCode: String(data.target_field_code || data.targetFieldCode || ''),
      entityTypeId:
        data.entity_type_id || data.entityTypeId
          ? String(data.entity_type_id || data.entityTypeId)
          : undefined,
      ruleExpression: String(data.rule_expression || data.ruleExpression || ''),
      isVisible: Boolean(data.is_visible ?? data.isVisible ?? true),
      priority: Number(data.priority || 0),
      isActive: Boolean(data.is_active ?? data.isActive ?? true),
    };
  }

  private transformComplianceToggle(
    data: Record<string, unknown>
  ): CountryComplianceToggle {
    return {
      id: String(data.id || ''),
      complianceCode: String(data.compliance_code || data.complianceCode || ''),
      complianceName: String(data.compliance_name || data.complianceName || ''),
      description: data.description ? String(data.description) : undefined,
      isEnabled: Boolean(data.is_enabled ?? data.isEnabled ?? true),
      configurationJson:
        data.configuration_json || data.configurationJson
          ? String(data.configuration_json || data.configurationJson)
          : undefined,
    };
  }

  private transformTag(data: Record<string, unknown>): ConfigurationTag {
    return {
      id: String(data.id || ''),
      tagName: String(data.tag_name || data.tagName || ''),
      tagValue:
        data.tag_value || data.tagValue
          ? String(data.tag_value || data.tagValue)
          : undefined,
    };
  }
}

export const countryConfigApiService = new CountryConfigApiService();
