import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateUserIdFromEmail, 
  getDashboard, 
  findUserCaseByEmail, 
  getCaseById,
  getMyThreads,
  getThreadByApplication,
  getThreadMessages,
  sendMessage,
  markMessageRead,
  getUnreadCount,
  getApplicationSections,
  getApplicationDocuments,
  getUserProfile,
  getHandlerProfile,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  changePassword,
  downloadUserData,
  deleteUserAccount,
  getUserCaseSummary,
  starMessage,
  archiveThread,
  forwardMessage,
  deleteMessage
} from '../api';

global.fetch = vi.fn();

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

describe('api utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock session endpoint and API calls
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
        });
      }
      // Default mock for API calls
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
        text: async () => '',
        headers: new Headers(),
      });
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

    it('should generate UUID format', () => {
      const id = generateUserIdFromEmail('test@example.com');
      // Should be in UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should handle different emails', () => {
      const id1 = generateUserIdFromEmail('user1@example.com');
      const id2 = generateUserIdFromEmail('user2@example.com');
      expect(id1).not.toBe(id2);
    });

    it('should handle empty email', () => {
      const id = generateUserIdFromEmail('');
      expect(id).toBe('');
    });
  });

  describe('getDashboard', () => {
    it('should fetch dashboard data', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ generatedAt: new Date().toISOString(), cases: {}, performance: {}, risk: {} }),
          headers: new Headers(),
        });
      });
      await expect(getDashboard()).resolves.toBeDefined();
    });
  });

  describe('findUserCaseByEmail', () => {
    it('should return null for empty email', async () => {
      const result = await findUserCaseByEmail('');
      expect(result).toBeNull();
    });

    it('should fetch user case by email', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ caseId: 'test-case', applicantEmail: 'test@example.com' }] }),
        headers: new Headers(),
      });
      await expect(findUserCaseByEmail('test@example.com')).resolves.toBeDefined();
    });
  });

  describe('getCaseById', () => {
    it('should fetch case by ID', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ caseId: 'test-case' }),
        headers: new Headers(),
      });
      await expect(getCaseById('test-case')).resolves.toBeDefined();
    });
  });

  describe('Messaging functions', () => {
    it('should get my threads', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], totalCount: 0 }),
        headers: new Headers(),
      });
      await expect(getMyThreads()).resolves.toBeDefined();
    });

    it('should get thread by application', async () => {
      // Use a GUID to avoid GUID lookup
      const guid = '12345678-1234-1234-1234-123456789abc';
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        // getThreadByApplication call
        return Promise.resolve({
          ok: true,
          json: async () => ({ threadId: 'thread-1' }),
          headers: new Headers(),
        });
      });
      await expect(getThreadByApplication(guid)).resolves.toBeDefined();
    });

    it('should get thread messages', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], totalCount: 0 }),
        headers: new Headers(),
      });
      await expect(getThreadMessages('thread-1')).resolves.toBeDefined();
    });

    it('should send message', async () => {
      // Use a GUID to avoid GUID lookup
      const guid = '12345678-1234-1234-1234-123456789abc';
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ user: { email: 'test@example.com', name: 'Test User' } }),
          });
        }
        // sendMessage call
        return Promise.resolve({
          ok: true,
          json: async () => ({ messageId: 'msg-1' }),
          headers: new Headers(),
        });
      });
      await expect(sendMessage(guid, 'Test message')).resolves.toBeDefined();
    });

    it('should mark message as read', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });
      await expect(markMessageRead('msg-1')).resolves.toBeDefined();
    });

    it('should get unread count', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unreadCount: 5 }),
        headers: new Headers(),
      });
      await expect(getUnreadCount()).resolves.toBeDefined();
    });

    it('should star message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, isStarred: true }),
        headers: new Headers(),
      });
      await expect(starMessage('msg-1')).resolves.toBeDefined();
    });

    it('should archive thread', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, isArchived: true }),
        headers: new Headers(),
      });
      await expect(archiveThread('thread-1')).resolves.toBeDefined();
    });

    it('should forward message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });
      await expect(forwardMessage('msg-1', 'thread-2', 'Forwarded')).resolves.toBeDefined();
    });

    it('should delete message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });
      await expect(deleteMessage('msg-1')).resolves.toBeDefined();
    });
  });

  describe('Application functions', () => {
    it('should get application sections', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
        headers: new Headers(),
      });
      await expect(getApplicationSections('app-1')).resolves.toBeDefined();
    });

    it('should get application documents', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
        headers: new Headers(),
      });
      await expect(getApplicationDocuments('app-1')).resolves.toBeDefined();
    });
  });

  describe('User profile functions', () => {
    it('should get user profile', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1', email: 'test@example.com' }),
        headers: new Headers(),
      });
      await expect(getUserProfile()).resolves.toBeDefined();
    });

    it('should get handler profile', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'handler-1', fullName: 'Handler Name' }),
        headers: new Headers(),
      });
      await expect(getHandlerProfile('handler-1')).resolves.toBeDefined();
    });

    it('should update user profile', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1', email: 'test@example.com' }),
        headers: new Headers(),
      });
      await expect(updateUserProfile({ firstName: 'Test' })).resolves.toBeDefined();
    });

    it('should get notification preferences', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailNotifications: true }),
        headers: new Headers(),
      });
      await expect(getNotificationPreferences()).resolves.toBeDefined();
    });

    it('should update notification preferences', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user-1', email: 'test@example.com' }),
        headers: new Headers(),
      });
      await expect(updateNotificationPreferences({ emailNotifications: true })).resolves.toBeDefined();
    });

    it('should change password', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });
      await expect(changePassword({ currentPassword: 'old', newPassword: 'new' })).resolves.toBeDefined();
    });

    it('should download user data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['test data']),
        headers: new Headers(),
      });
      await expect(downloadUserData()).resolves.toBeDefined();
    });

    it('should delete user account', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      });
      await expect(deleteUserAccount({ reason: 'test' })).resolves.toBeDefined();
    });

    it('should get user case summary', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalCases: 0 }),
        headers: new Headers(),
      });
      await expect(getUserCaseSummary()).resolves.toBeDefined();
    });
  });
});
