/**
 * Email Analytics
 * Tracks email delivery, opens, clicks, and other metrics
 */

export interface EmailEvent {
  email: string;
  messageId: string;
  eventType: 'processed' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'deferred' | 'unsubscribe' | 'spamreport';
  timestamp: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'email_analytics';
const MAX_EVENTS = 1000; // Keep last 1000 events

/**
 * Track email event
 */
export function trackEmailEvent(event: EmailEvent): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const events = getEmailEvents();
    events.push({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    // Keep only last MAX_EVENTS
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to track email event:', error);
  }
}

/**
 * Get all tracked email events
 */
export function getEmailEvents(): EmailEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load email events:', error);
    return [];
  }
}

/**
 * Get email events for a specific message
 */
export function getEmailEventsForMessage(messageId: string): EmailEvent[] {
  const events = getEmailEvents();
  return events.filter((e) => e.messageId === messageId);
}

/**
 * Get email statistics
 */
export function getEmailStatistics(): {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  dropped: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
} {
  const events = getEmailEvents();
  const delivered = events.filter((e) => e.eventType === 'delivered').length;
  const opened = events.filter((e) => e.eventType === 'opened').length;
  const clicked = events.filter((e) => e.eventType === 'clicked').length;
  const bounced = events.filter((e) => e.eventType === 'bounced').length;
  const dropped = events.filter((e) => e.eventType === 'dropped').length;

  const uniqueMessages = new Set(events.map((e) => e.messageId));
  const total = uniqueMessages.size;

  return {
    total,
    delivered,
    opened,
    clicked,
    bounced,
    dropped,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
  };
}

/**
 * Clear email analytics
 */
export function clearEmailAnalytics(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.info('Email analytics cleared');
  } catch (error) {
    console.error('Failed to clear email analytics:', error);
  }
}

/**
 * Get email events for a specific email address
 */
export function getEmailEventsForAddress(email: string): EmailEvent[] {
  const events = getEmailEvents();
  return events.filter((e) => e.email.toLowerCase() === email.toLowerCase());
}

