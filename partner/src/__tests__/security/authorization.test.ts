import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateOwnership, requireAuth } from '@/middleware/authorization';
import { NextRequest } from 'next/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Authorization Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOwnership', () => {
    it('should reject when resource has no partnerId', async () => {
      const result = await validateOwnership('user@example.com', null);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should reject when partnerId does not match user', async () => {
      const userEmail = 'user@example.com';
      const wrongPartnerId = '00000000-0000-0000-0000-000000000000';
      
      const result = await validateOwnership(userEmail, wrongPartnerId);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should allow when partnerId matches user', async () => {
      const userEmail = 'user@example.com';
      // Generate the correct PartnerId for this email
      const { generatePartnerId } = await import('@/lib/partnerIdUtils');
      const correctPartnerId = generatePartnerId(userEmail);
      
      const result = await validateOwnership(userEmail, correctPartnerId);
      
      expect(result).toBeNull(); // No error
    });

    it('should be case-insensitive for partnerId comparison', async () => {
      const userEmail = 'user@example.com';
      const { generatePartnerId } = await import('@/lib/partnerIdUtils');
      const correctPartnerId = generatePartnerId(userEmail);
      const upperCasePartnerId = correctPartnerId.toUpperCase();
      
      const result = await validateOwnership(userEmail, upperCasePartnerId);
      
      expect(result).toBeNull(); // No error
    });
  });

  describe('requireAuth', () => {
    it('should return 401 when no session exists', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(request);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
    });

    it('should return 401 when session has no email', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: { name: 'Test User' },
        expires: '2025-12-31',
      } as any);
      
      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(request);
      
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
    });

    it('should allow when valid session exists', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: { 
          name: 'Test User',
          email: 'test@example.com',
        },
        expires: '2025-12-31',
      } as any);
      
      const request = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(request);
      
      expect(result).toBeNull(); // No error
    });
  });
});
