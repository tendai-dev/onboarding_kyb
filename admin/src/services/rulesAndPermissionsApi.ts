// Removed unused import: getSession

// Use Next.js API route for proxying to avoid CORS and connection issues
const API_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003';

// Types matching the backend DTOs
export interface User {
  id: string;
  email: string;
  name?: string;
  firstLoginAt: string;
  first_login_at?: string; // Backend returns snake_case
  lastLoginAt: string;
  last_login_at?: string; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
  permissions: Permission[];
  roles: UserRole[];
}

export interface Permission {
  id: string;
  permissionName: string;
  permission_name?: string; // Backend returns snake_case
  resource?: string;
  description?: string;
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
  createdBy?: string;
  created_by?: string; // Backend returns snake_case
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  display_name?: string; // Backend returns snake_case
  description?: string;
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
  updatedAt: string;
  updated_at?: string; // Backend returns snake_case
  permissions: RolePermission[];
}

export interface RolePermission {
  id: string;
  permissionName: string;
  permission_name?: string; // Backend returns snake_case
  resource?: string;
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
}

export interface UserRole {
  id: string;
  roleId: string;
  role_id?: string; // Backend returns snake_case
  roleName: string;
  role_name?: string; // Backend returns snake_case
  roleDisplayName: string;
  role_display_name?: string; // Backend returns snake_case
  isActive: boolean;
  is_active?: boolean; // Backend returns snake_case
  createdAt: string;
  created_at?: string; // Backend returns snake_case
}

export interface CreateOrUpdateUserRequest {
  email: string;
  name?: string;
}

export interface GrantPermissionRequest {
  permissionName: string;
  resource?: string;
  description?: string;
}

class RulesAndPermissionsApiService {
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
        console.warn('Failed to get session:', error);
      }
    }
    // Server-side: API proxy will inject token from Redis, no need to add here

    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Use Next.js API route when in browser, direct URL when server-side
    const baseUrl =
      typeof window !== 'undefined'
        ? '/api/rules-and-permissions'
        : `${API_BASE_URL}/api/v1`;
    const url = `${baseUrl}${endpoint}`;
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
        let errorMessage = `Rules and Permissions API request failed: ${response.status} ${response.statusText}`;

        // Try to parse error message from JSON response
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // If not JSON, use the text as is
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
        throw new Error('Unable to connect to Rules and Permissions service');
      }
      throw error;
    }
  }

  // Users endpoints
  async getAllUsers(includePermissions = true): Promise<User[]> {
    const params = new URLSearchParams();
    if (includePermissions) params.append('includePermissions', 'true');
    // Request all users (large page size)
    params.append('page', '1');
    params.append('pageSize', '1000');

    const queryString = params.toString();
    const response = await this.request<Record<string, unknown>>(
      `/users${queryString ? `?${queryString}` : ''}`
    );

    // Authentication service returns { users: UserDto[], totalCount, page, ... }
    // Transform to User[] format expected by frontend
    const users =
      'users' in response && Array.isArray(response.users) ? response.users : null;
    if (users) {
      return users.map((user: Record<string, unknown>) => ({
        id: String(user.id || user.Id || ''),
        email: String(user.email || user.Email || ''),
        name: String(user.name || user.Name || user.fullName || ''),
        firstLoginAt: String(
          user.firstLoginAt || user.firstLogin || user.lastLogin || ''
        ),
        lastLoginAt: String(user.lastLoginAt || user.lastLogin || ''),
        createdAt: String(user.createdAt || user.CreatedAt || ''),
        permissions: (Array.isArray(user.permissions)
          ? user.permissions
          : Array.isArray(user.Permissions)
            ? user.Permissions
            : []
        ).map((perm: Record<string, unknown>) => ({
          id: String(perm.id || perm.Id || ''),
          permissionName: String(
            perm.permissionName || perm.PermissionName || perm.permission_name || ''
          ),
          resource:
            perm.resource || perm.Resource
              ? String(perm.resource || perm.Resource)
              : undefined,
          description:
            perm.description || perm.Description
              ? String(perm.description || perm.Description)
              : undefined,
          isActive:
            perm.isActive !== undefined
              ? Boolean(perm.isActive)
              : perm.IsActive !== undefined
                ? Boolean(perm.IsActive)
                : perm.is_active !== undefined
                  ? Boolean(perm.is_active)
                  : true,
          createdAt: String(perm.createdAt || perm.CreatedAt || perm.created_at || ''),
          createdBy:
            perm.createdBy || perm.CreatedBy || perm.created_by
              ? String(perm.createdBy || perm.CreatedBy || perm.created_by)
              : undefined,
        })),
        roles: (Array.isArray(user.roles) ? user.roles : []).map((roleName: string) => ({
          id: '',
          roleId: '',
          roleName: roleName,
          roleDisplayName: roleName,
          isActive: true,
          createdAt: '',
        })),
      }));
    }

    // Fallback: if response is already an array, transform snake_case to camelCase
    if (Array.isArray(response)) {
      return response.map((user: Record<string, unknown>) => ({
        id: String(user.id || user.Id || ''),
        email: String(user.email || user.Email || ''),
        name: String(user.name || user.Name || user.fullName || ''),
        firstLoginAt: String(
          user.firstLoginAt ||
            user.firstLogin ||
            user.first_login_at ||
            user.first_login ||
            ''
        ),
        lastLoginAt: String(
          user.lastLoginAt ||
            user.lastLogin ||
            user.last_login_at ||
            user.last_login ||
            ''
        ),
        createdAt: String(user.createdAt || user.CreatedAt || user.created_at || ''),
        permissions: (Array.isArray(user.permissions)
          ? user.permissions
          : Array.isArray(user.Permissions)
            ? user.Permissions
            : []
        ).map((perm: Record<string, unknown>) => ({
          id: String(perm.id || perm.Id || ''),
          permissionName: String(
            perm.permissionName || perm.PermissionName || perm.permission_name || ''
          ),
          resource:
            perm.resource || perm.Resource
              ? String(perm.resource || perm.Resource)
              : undefined,
          description:
            perm.description || perm.Description
              ? String(perm.description || perm.Description)
              : undefined,
          isActive:
            perm.isActive !== undefined
              ? Boolean(perm.isActive)
              : perm.IsActive !== undefined
                ? Boolean(perm.IsActive)
                : perm.is_active !== undefined
                  ? Boolean(perm.is_active)
                  : true,
          createdAt: String(perm.createdAt || perm.CreatedAt || perm.created_at || ''),
          createdBy:
            perm.createdBy || perm.CreatedBy || perm.created_by
              ? String(perm.createdBy || perm.CreatedBy || perm.created_by)
              : undefined,
        })),
        roles: (Array.isArray(user.roles)
          ? user.roles
          : Array.isArray(user.Roles)
            ? user.Roles
            : []
        ).map((userRole: Record<string, unknown>) => ({
          id: String(userRole.id || userRole.Id || ''),
          roleId: String(userRole.roleId || userRole.RoleId || userRole.role_id || ''),
          roleName: String(
            userRole.roleName || userRole.RoleName || userRole.role_name || ''
          ),
          roleDisplayName: String(
            userRole.roleDisplayName ||
              userRole.RoleDisplayName ||
              userRole.role_display_name ||
              userRole.roleName ||
              ''
          ),
          isActive:
            userRole.isActive !== undefined
              ? Boolean(userRole.isActive)
              : userRole.IsActive !== undefined
                ? Boolean(userRole.IsActive)
                : userRole.is_active !== undefined
                  ? Boolean(userRole.is_active)
                  : true,
          createdAt: String(
            userRole.createdAt || userRole.CreatedAt || userRole.created_at || ''
          ),
        })),
      }));
    }

    return [];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users/by-email/${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      // Backend doesn't have a GET /users/{id} endpoint yet, so we fetch all users and filter
      const users = await this.getAllUsers(true);
      const user = users.find((u) => u.id === userId);
      return user || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateUser(data: CreateOrUpdateUserRequest): Promise<unknown> {
    return this.request<unknown>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Permissions endpoints
  async grantPermission(userId: string, data: GrantPermissionRequest): Promise<unknown> {
    return this.request<unknown>(`/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokePermission(permissionId: string): Promise<void> {
    return this.request<void>(`/users/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // Roles endpoints
  async getAllRoles(includePermissions = true): Promise<Role[]> {
    const params = new URLSearchParams();
    if (includePermissions) params.append('includePermissions', 'true');

    const queryString = params.toString();
    const response = await this.request<Record<string, unknown>>(
      `/roles${queryString ? `?${queryString}` : ''}`
    );

    // Authentication service returns { roles: RoleDto[] }
    // Transform to Role[] format expected by frontend
    if (
      response &&
      typeof response === 'object' &&
      'roles' in response &&
      Array.isArray(response.roles)
    ) {
      return response.roles.map((role: Record<string, unknown>) => ({
        id: String(role.id || role.Id || ''),
        name: String(role.name || role.Name || ''),
        displayName: String(
          role.displayName ||
            role.DisplayName ||
            role.display_name ||
            role.name ||
            role.Name ||
            ''
        ),
        description: String(
          role.description || role.Description || role.description || ''
        ),
        isActive:
          role.isActive !== undefined
            ? Boolean(role.isActive)
            : role.IsActive !== undefined
              ? Boolean(role.IsActive)
              : role.is_active !== undefined
                ? Boolean(role.is_active)
                : true,
        createdAt: String(
          role.createdAt || role.CreatedAt || role.created_at || new Date().toISOString()
        ),
        updatedAt: String(
          role.updatedAt || role.UpdatedAt || role.updated_at || new Date().toISOString()
        ),
        permissions: (Array.isArray(role.permissions)
          ? role.permissions
          : Array.isArray(role.Permissions)
            ? role.Permissions
            : []
        ).map((perm: Record<string, unknown>) => ({
          id: String(perm.id || perm.Id || ''),
          permissionName: String(
            perm.permissionName || perm.PermissionName || perm.permission_name || ''
          ),
          resource:
            perm.resource || perm.Resource
              ? String(perm.resource || perm.Resource)
              : undefined,
          isActive:
            perm.isActive !== undefined
              ? Boolean(perm.isActive)
              : perm.IsActive !== undefined
                ? Boolean(perm.IsActive)
                : perm.is_active !== undefined
                  ? Boolean(perm.is_active)
                  : true,
        })),
      }));
    }

    // Fallback: if response is already an array, transform snake_case to camelCase
    if (Array.isArray(response)) {
      return response.map((role: Record<string, unknown>) => ({
        id: String(role.id || role.Id || ''),
        name: String(role.name || role.Name || ''),
        displayName: String(
          role.displayName ||
            role.DisplayName ||
            role.display_name ||
            role.name ||
            role.Name ||
            ''
        ),
        description: String(
          role.description || role.Description || role.description || ''
        ),
        isActive:
          role.isActive !== undefined
            ? Boolean(role.isActive)
            : role.IsActive !== undefined
              ? Boolean(role.IsActive)
              : role.is_active !== undefined
                ? Boolean(role.is_active)
                : true,
        createdAt: String(
          role.createdAt || role.CreatedAt || role.created_at || new Date().toISOString()
        ),
        updatedAt: String(
          role.updatedAt || role.UpdatedAt || role.updated_at || new Date().toISOString()
        ),
        permissions: (Array.isArray(role.permissions)
          ? role.permissions
          : Array.isArray(role.Permissions)
            ? role.Permissions
            : []
        ).map((perm: Record<string, unknown>) => ({
          id: String(perm.id || perm.Id || ''),
          permissionName: String(
            perm.permissionName ||
              perm.PermissionName ||
              perm.permission_name ||
              perm.permissionName ||
              ''
          ),
          resource:
            perm.resource || perm.Resource
              ? String(perm.resource || perm.Resource)
              : undefined,
          isActive:
            perm.isActive !== undefined
              ? Boolean(perm.isActive)
              : perm.IsActive !== undefined
                ? Boolean(perm.IsActive)
                : perm.is_active !== undefined
                  ? Boolean(perm.is_active)
                  : true,
        })),
      }));
    }

    return [];
  }

  async getRoleById(roleId: string, includePermissions = true): Promise<Role> {
    const params = new URLSearchParams();
    if (includePermissions) params.append('includePermissions', 'true');

    const queryString = params.toString();
    return this.request<Role>(`/roles/${roleId}${queryString ? `?${queryString}` : ''}`);
  }

  async createRole(data: CreateRoleRequest): Promise<unknown> {
    return this.request<unknown>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(roleId: string, data: UpdateRoleRequest): Promise<unknown> {
    // Backend expects snake_case
    return this.request<unknown>(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({
        display_name: data.displayName,
        description: data.description,
      }),
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.request<void>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  async addPermissionToRole(
    roleId: string,
    data: AddPermissionToRoleRequest
  ): Promise<unknown> {
    // Backend expects snake_case
    return this.request<unknown>(`/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({
        permission_name: data.permissionName,
        resource: data.resource,
      }),
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    return this.request<void>(`/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<unknown> {
    // Backend expects snake_case
    return this.request<unknown>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId }),
    });
  }

  async removeRoleFromUser(userId: string, userRoleId: string): Promise<void> {
    return this.request<void>(`/users/${userId}/roles/${userRoleId}`, {
      method: 'DELETE',
    });
  }
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateRoleRequest {
  displayName: string;
  description?: string;
}

export interface AddPermissionToRoleRequest {
  permissionName: string;
  resource?: string;
}

export const _rulesAndPermissionsApiService = new RulesAndPermissionsApiService();
export const rulesAndPermissionsApiService = _rulesAndPermissionsApiService;
