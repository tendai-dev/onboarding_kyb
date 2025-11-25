// Browser Push Notifications Service
// This service handles browser push notifications for new messages
// Note: Service worker removed per requirements - using standard browser notifications only

export class PushNotificationService {
  private static instance: PushNotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.permission = Notification.permission;
    }
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[PushNotifications] This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('[PushNotifications] Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  public async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return;
      }
    }

    const defaultOptions: NotificationOptions = {
      icon: '/mukuru-logo.png',
      badge: '/mukuru-logo.png',
      tag: 'message',
      requireInteraction: false,
      ...options,
    };

    // Use standard browser notifications (service worker removed)
    new Notification(title, defaultOptions);
  }

  public async showMessageNotification(
    senderName: string,
    content: string,
    threadId?: string
  ): Promise<void> {
    await this.showNotification(
      `New message from ${senderName}`,
      {
        body: content.length > 100 ? content.substring(0, 100) + '...' : content,
        tag: `message-${threadId || 'new'}`,
        data: { threadId },
        requireInteraction: false,
      }
    );
  }

  public getPermission(): NotificationPermission {
    return this.permission;
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

