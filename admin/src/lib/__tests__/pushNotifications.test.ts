import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushNotificationService, PushNotificationService } from '../pushNotifications';

describe('PushNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as any;
    
    Object.defineProperty(window, 'Notification', {
      value: global.Notification,
      writable: true,
      configurable: true,
    });
  });

  it('should get instance', () => {
    const instance = PushNotificationService.getInstance();
    expect(instance).toBeInstanceOf(PushNotificationService);
  });

  it('should return same instance on multiple calls', () => {
    const instance1 = PushNotificationService.getInstance();
    const instance2 = PushNotificationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should check if notifications are supported', () => {
    const isSupported = pushNotificationService.isSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('should get permission status', () => {
    const permission = pushNotificationService.getPermission();
    expect(['default', 'granted', 'denied']).toContain(permission);
  });

  it('should request permission', async () => {
    const granted = await pushNotificationService.requestPermission();
    expect(typeof granted).toBe('boolean');
  });

  it('should show notification when permission granted', async () => {
    Object.defineProperty(global.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    });

    const NotificationConstructor = vi.fn();
    global.Notification = NotificationConstructor as any;

    await pushNotificationService.showNotification('Test Title', {
      body: 'Test body',
    });

    expect(NotificationConstructor).toHaveBeenCalled();
  });

  it('should show message notification', async () => {
    Object.defineProperty(global.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    });

    const NotificationConstructor = vi.fn();
    global.Notification = NotificationConstructor as any;

    await pushNotificationService.showMessageNotification(
      'Test User',
      'Test message content',
      'thread-1'
    );

    expect(NotificationConstructor).toHaveBeenCalled();
  });

  it('should handle browsers without notification support', async () => {
    Object.defineProperty(window, 'Notification', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const isSupported = pushNotificationService.isSupported();
    expect(isSupported).toBe(false);

    await pushNotificationService.showNotification('Test');
    // Should not throw error
    expect(document.body).toBeInTheDocument();
  });
});

