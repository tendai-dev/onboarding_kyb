/**
 * Email Preferences Management
 * Handles user email notification preferences
 */

export interface EmailPreferences {
  welcome: boolean;
  statusUpdates: boolean;
  acknowledgements: boolean;
  messages: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  welcome: true,
  statusUpdates: true,
  acknowledgements: true,
  messages: true,
  marketing: false,
};

const STORAGE_KEY = 'email_preferences';

/**
 * Get user email preferences from localStorage
 */
export function getEmailPreferences(): EmailPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load email preferences:', error);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save user email preferences to localStorage
 */
export function saveEmailPreferences(preferences: Partial<EmailPreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getEmailPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.info('Email preferences saved:', updated);
  } catch (error) {
    console.error('Failed to save email preferences:', error);
  }
}

/**
 * Check if a specific email type is enabled
 */
export function isEmailEnabled(type: keyof EmailPreferences): boolean {
  const preferences = getEmailPreferences();
  return preferences[type] ?? true;
}

/**
 * Reset email preferences to defaults
 */
export function resetEmailPreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    console.info('Email preferences reset to defaults');
  } catch (error) {
    console.error('Failed to reset email preferences:', error);
  }
}

/**
 * Check if user should receive email notification
 */
export function shouldSendEmail(type: 'welcome' | 'status' | 'acknowledgement' | 'message'): boolean {
  const preferences = getEmailPreferences();
  
  switch (type) {
    case 'welcome':
      return preferences.welcome;
    case 'status':
      return preferences.statusUpdates;
    case 'acknowledgement':
      return preferences.acknowledgements;
    case 'message':
      return preferences.messages;
    default:
      return true;
  }
}

