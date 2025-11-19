import { getSession } from 'next-auth/react';

// Use Next.js API route for proxying to avoid CORS and connection issues
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_ENTITY_CONFIG_API_BASE_URL || 'http://localhost:8003');

// Types matching the backend DTOs
export interface User {
  id: string;
  email: string;
  name?: string;
  firstLoginAt: string;
  lastLoginAt: string;
  createdAt: string;
  permissions: Permission[];
  roles: UserRole[];
}

export interface Permission {
  id: string;
  permissionName: string;
  resource?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
}

export interface RolePermission {
  id: string;
  permissionName: string;
  resource?: string;
  isActive: boolean;
}

export interface UserRole {
  id: string;
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  isActive: boolean;
  createdAt: string;
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
    const baseUrl = typeof window !== 'undefined' 
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

  // Users endpoints
  async getAllUsers(includePermissions = true): Promise<User[]> {
    const params = new URLSearchParams();
    if (includePermissions) params.append('includePermissions', 'true');
    
    const queryString = params.toString();
    return this.request<User[]>(`/users${queryString ? `?${queryString}` : ''}`);
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

  async createOrUpdateUser(data: CreateOrUpdateUserRequest): Promise<any> {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Permissions endpoints
  async grantPermission(userId: string, data: GrantPermissionRequest): Promise<any> {
    return this.request<any>(`/users/${userId}/permissions`, {
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
    return this.request<Role[]>(`/roles${queryString ? `?${queryString}` : ''}`);
  }

  async getRoleById(roleId: string, includePermissions = true): Promise<Role> {
    const params = new URLSearchParams();
    if (includePermissions) params.append('includePermissions', 'true');
    
    const queryString = params.toString();
    return this.request<Role>(`/roles/${roleId}${queryString ? `?${queryString}` : ''}`);
  }

  async createRole(data: CreateRoleRequest): Promise<any> {
    return this.request<any>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(roleId: string, data: UpdateRoleRequest): Promise<any> {
    return this.request<any>(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    return this.request<void>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  async addPermissionToRole(roleId: string, data: AddPermissionToRoleRequest): Promise<any> {
    return this.request<any>(`/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    return this.request<void>(`/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<any> {
    return this.request<any>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
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

export const rulesAndPermissionsApiService = new RulesAndPermissionsApiService();

