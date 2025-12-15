/**
 * Notification Service
 * Centralized service for sending email notifications
 * All emails are sent through the backend API which has SendGrid configured.
 * The backend is the single source of truth for email configuration.
 */

import { sendEmailNotification, EmailTemplateData } from './emailTemplates';
import { retryEmailSend } from './emailRetry';
import { shouldSendEmail } from './emailPreferences';
import { canSendEmail, recordEmailSend } from './emailRateLimit';

export interface NotificationOptions {
  to: string;
  applicantName?: string;
  caseId?: string;
  caseNumber?: string;
  link?: string;
  [key: string]: any;
}

/**
 * Send welcome email when application is created
 */
export async function sendWelcomeNotification(options: NotificationOptions): Promise<boolean> {
  // Check user preferences
  if (!shouldSendEmail('welcome')) {
    console.info('Welcome email disabled by user preferences');
    return false;
  }

  // Check rate limits
  const rateLimitCheck = canSendEmail();
  if (!rateLimitCheck.allowed) {
    console.warn('Welcome email blocked by rate limit:', rateLimitCheck.reason);
    return false;
  }

  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `Welcome to Mukuru Onboarding - Case ${options.caseNumber || options.caseId || ''}`,
          'welcome',
          {
            applicantName: options.applicantName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            link: options.link || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/partner/dashboard`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
      console.info('Welcome email sent successfully to:', options.to);
      return true;
    } else {
      console.error('Failed to send welcome email:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send status update email when application status changes
 */
export async function sendStatusUpdateNotification(
  options: NotificationOptions & { status: string; message?: string }
): Promise<boolean> {
  // Check user preferences
  if (!shouldSendEmail('status')) {
    console.info('Status update email disabled by user preferences');
    return false;
  }

  // Check rate limits
  const rateLimitCheck = canSendEmail();
  if (!rateLimitCheck.allowed) {
    console.warn('Status update email blocked by rate limit:', rateLimitCheck.reason);
    return false;
  }

  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `Application Status Update - Case ${options.caseNumber || options.caseId || ''}`,
          'status',
          {
            applicantName: options.applicantName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            status: options.status,
            message: options.message,
            link: options.link || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/partner/dashboard`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
      recordEmailSend(); // Record successful send for rate limiting
      console.info('Status update email sent successfully to:', options.to, `(attempts: ${result.attempts})`);
      return true;
    } else {
      console.error('Failed to send status update email:', result.error, `(attempts: ${result.attempts})`);
      return false;
    }
  } catch (error) {
    console.error('Error sending status update email:', error);
    return false;
  }
}

/**
 * Send acknowledgement request email
 */
export async function sendAcknowledgementNotification(
  options: NotificationOptions & { applicationId: string }
): Promise<boolean> {
  // Check user preferences
  if (!shouldSendEmail('acknowledgement')) {
    console.info('Acknowledgement email disabled by user preferences');
    return false;
  }

  // Check rate limits
  const rateLimitCheck = canSendEmail();
  if (!rateLimitCheck.allowed) {
    console.warn('Acknowledgement email blocked by rate limit:', rateLimitCheck.reason);
    return false;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `Final Acknowledgement Required - Case ${options.caseNumber || options.caseId || ''}`,
          'acknowledgement',
          {
            applicantName: options.applicantName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            link: options.link || `${baseUrl}/partner/acknowledgement/${options.applicationId}`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
      recordEmailSend(); // Record successful send for rate limiting
      console.info('Acknowledgement email sent successfully to:', options.to, `(attempts: ${result.attempts})`);
      return true;
    } else {
      console.error('Failed to send acknowledgement email:', result.error, `(attempts: ${result.attempts})`);
      return false;
    }
  } catch (error) {
    console.error('Error sending acknowledgement email:', error);
    return false;
  }
}

/**
 * Send message notification email
 */
export async function sendMessageNotification(
  options: NotificationOptions & { message: string; senderName?: string }
): Promise<boolean> {
  // Check user preferences
  if (!shouldSendEmail('message')) {
    console.info('Message notification email disabled by user preferences');
    return false;
  }

  // Check rate limits
  const rateLimitCheck = canSendEmail();
  if (!rateLimitCheck.allowed) {
    console.warn('Message notification email blocked by rate limit:', rateLimitCheck.reason);
    return false;
  }

  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `New Message - Case ${options.caseNumber || options.caseId || ''}`,
          'message',
          {
            applicantName: options.applicantName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            message: options.message,
            senderName: options.senderName,
            link: options.link || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/partner/messages`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
      recordEmailSend(); // Record successful send for rate limiting
      console.info('Message notification email sent successfully to:', options.to, `(attempts: ${result.attempts})`);
      return true;
    } else {
      console.error('Failed to send message notification email:', result.error, `(attempts: ${result.attempts})`);
      return false;
    }
  } catch (error) {
    console.error('Error sending message notification email:', error);
    return false;
  }
}

/**
 * Send custom email notification
 */
export async function sendCustomNotification(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<boolean> {
  try {
    // Call backend API via proxy instead of direct SendGrid
    // Backend has SendGrid integrated and is the single source of truth
    const response = await fetch('/api/proxy/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        type: 'Message',
        channel: 'Email',
        recipient: to,
        subject,
        htmlContent,
        textContent,
        content: textContent || htmlContent, // Fallback for backend compatibility
        priority: 'Medium',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send custom email:', error);
      return false;
    }

    console.info('Custom email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending custom email:', error);
    return false;
  }
}

