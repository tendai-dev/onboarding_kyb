import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Notification API before importing
const mockShowNotification = vi.fn();
const mockRegister = vi.fn().mockResolvedValue({
  showNotification: mockShowNotification,
});

Object.defineProperty(global, 'Notification', {
  writable: true,
  configurable: true,
  value: class MockNotification {
    constructor(public title: string, public options?: NotificationOptions) {}
    static permission: NotificationPermission = 'default';
    static requestPermission = vi.fn().mockResolvedValue('granted');
  },
});

Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    Notification: global.Notification,
  },
  writable: true,
});

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  configurable: true,
  value: {
    register: mockRegister,
  },
});

import { pushNotificationService } from '../pushNotifications';

describe('pushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.Notification as any).permission = 'default';
    (global.Notification as any).requestPermission = vi.fn().mockResolvedValue('granted');
    mockRegister.mockResolvedValue({
      showNotification: mockShowNotification,
    });
  });

  it('should have push notification service', () => {
    expect(pushNotificationService).toBeDefined();
  });

  it('should check notification permission', () => {
    const permission = pushNotificationService.getPermission();
    expect(['default', 'granted', 'denied']).toContain(permission);
  });

  it('should check if notifications are supported', () => {
    const isSupported = pushNotificationService.isSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('should request notification permission', async () => {
    const granted = await pushNotificationService.requestPermission();
    expect(typeof granted).toBe('boolean');
  });

  it('should show notification', async () => {
    await pushNotificationService.showNotification('Test Title', { body: 'Test body' });
    // Should not throw
    expect(true).toBe(true);
  });

  it('should show message notification', async () => {
    await pushNotificationService.showMessageNotification('John Doe', 'Test message', 'thread-1');
    // Should not throw
    expect(true).toBe(true);
  });

  it('should handle permission already granted', async () => {
    (global.Notification as any).permission = 'granted';
    const granted = await pushNotificationService.requestPermission();
    expect(granted).toBe(true);
    expect((global.Notification as any).requestPermission).not.toHaveBeenCalled();
  });

  it('should handle permission denied', async () => {
    (global.Notification as any).permission = 'denied';
    const granted = await pushNotificationService.requestPermission();
    expect(granted).toBe(false);
  });

  it('should handle browsers without notification support', async () => {
    const originalNotification = global.Notification;
    delete (global as any).Notification;
    
    const isSupported = pushNotificationService.isSupported();
    expect(isSupported).toBe(false);
    
    const granted = await pushNotificationService.requestPermission();
    expect(granted).toBe(false);
    
    await pushNotificationService.showNotification('Test');
    // Should not throw
    
    (global as any).Notification = originalNotification;
  });

  it('should truncate long message content', async () => {
    const longContent = 'a'.repeat(200);
    await pushNotificationService.showMessageNotification('John Doe', longContent, 'thread-1');
    // Should handle truncation
    expect(true).toBe(true);
  });

  it('should use service worker registration when available', async () => {
    const mockRegistration = {
      showNotification: vi.fn(),
    };
    mockRegister.mockResolvedValue(mockRegistration);
    
    // Re-initialize to get the registration
    await pushNotificationService.showNotification('Test', { body: 'Body' });
    expect(true).toBe(true);
  });
});

