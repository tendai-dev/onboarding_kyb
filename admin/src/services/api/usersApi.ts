/**
 * Users API Service
 * Handles all user-related API calls
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  first_login_at?: string;
  last_login_at?: string;
  created_at: string;
  roles?: Array<{
    id: string;
    role_id: string;
    role_name: string;
    role_display_name: string;
    is_active: boolean;
  }>;
}

/**
 * Get all users from the API
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/proxy/api/v1/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const users = await response.json();
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}
