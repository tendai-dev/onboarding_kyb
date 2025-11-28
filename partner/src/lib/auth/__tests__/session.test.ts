import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthUser, getInitials, logout, generateUserIdFromEmail } from '../session';
import { getSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
}));

describe('session utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthUser', () => {
    it('should return user from session', async () => {
      (getSession as any).mockResolvedValue({
        user: { name: 'Test User', email: 'test@example.com' },
      });

      const user = await getAuthUser();
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
    });

    it('should return null when no session', async () => {
      (getSession as any).mockResolvedValue(null);

      const user = await getAuthUser();
      expect(user).toBeNull();
    });
  });

  describe('getInitials', () => {
    it('should return initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });

    it('should handle multiple words', () => {
      expect(getInitials('John Michael Doe')).toBe('JD');
    });
  });

  describe('generateUserIdFromEmail', () => {
    it('should generate consistent ID from email', () => {
      const id1 = generateUserIdFromEmail('test@example.com');
      const id2 = generateUserIdFromEmail('test@example.com');
      expect(id1).toBe(id2);
    });

    it('should normalize email to lowercase', () => {
      const id1 = generateUserIdFromEmail('Test@Example.com');
      const id2 = generateUserIdFromEmail('test@example.com');
      expect(id1).toBe(id2);
    });
  });

  describe('logout', () => {
    it('should call signOut', async () => {
      const { signOut } = await import('next-auth/react');
      await logout('/');
      expect(signOut).toHaveBeenCalled();
    });
  });
});

