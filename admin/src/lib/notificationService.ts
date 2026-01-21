/**
 * Notification Service for Admin Portal
 * Centralized service for sending email notifications
 * All emails are sent through the backend API which has SendGrid configured.
 * The backend is the single source of truth for email configuration.
 */

import { sendEmailNotification, EmailTemplateData } from './emailTemplates';
import { retryEmailSend } from './emailRetry';

export interface NotificationOptions {
  to: string;
  recipientName?: string;
  caseId?: string;
  caseNumber?: string;
  link?: string;
  adminName?: string;
  applicationName?: string;
  [key: string]: any;
}

/**
 * Send status update email when admin changes application status
 */
export async function sendStatusUpdateEmail(
  options: NotificationOptions & { status: string; message?: string }
): Promise<boolean> {
  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `Application Status Update - Case ${options.caseNumber || options.caseId || ''}`,
          'status',
          {
            recipientName: options.recipientName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            status: options.status,
            message: options.message,
            adminName: options.adminName,
            link: options.link || `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/applications/${options.caseId}`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
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
 * Send message notification email when admin sends a message
 */
export async function sendMessageNotificationEmail(
  options: NotificationOptions & { message: string }
): Promise<boolean> {
  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `New Message from Support - Case ${options.caseNumber || options.caseId || ''}`,
          'message',
          {
            recipientName: options.recipientName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            message: options.message,
            adminName: options.adminName || 'Support Team',
            applicationName: options.applicationName,
            link: options.link || `https://partner.mukuru.com/messages`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
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
 * Send approval email when application is approved
 */
export async function sendApprovalEmail(
  options: NotificationOptions & { message?: string }
): Promise<boolean> {
  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `Application Approved - Case ${options.caseNumber || options.caseId || ''}`,
          'approval',
          {
            recipientName: options.recipientName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            message: options.message || 'Your application has been approved!',
            adminName: options.adminName,
            link: options.link || `https://partner.mukuru.com/dashboard`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
      console.info('Approval email sent successfully to:', options.to, `(attempts: ${result.attempts})`);
      return true;
    } else {
      console.error('Failed to send approval email:', result.error, `(attempts: ${result.attempts})`);
      return false;
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
}

/**
 * Send rejection email when application is rejected
 */
export async function sendRejectionEmail(
  options: NotificationOptions & { reason?: string }
): Promise<boolean> {
  try {
    const result = await retryEmailSend(
      () =>
        sendEmailNotification(
          options.to,
          `Application Update - Case ${options.caseNumber || options.caseId || ''}`,
          'rejection',
          {
            recipientName: options.recipientName || 'Valued Partner',
            caseId: options.caseId,
            caseNumber: options.caseNumber,
            message: options.reason || 'Your application has been declined. Please contact support for more information.',
            adminName: options.adminName,
            link: options.link || `https://partner.mukuru.com/dashboard`,
          }
        ),
      { maxRetries: 3 }
    );

    if (result.success) {
      console.info('Rejection email sent successfully to:', options.to, `(attempts: ${result.attempts})`);
      return true;
    } else {
      console.error('Failed to send rejection email:', result.error, `(attempts: ${result.attempts})`);
      return false;
    }
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
}

/**
 * Send custom email notification
 */
export async function sendCustomEmail(
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

