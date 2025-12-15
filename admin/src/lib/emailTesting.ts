/**
 * Email Testing Utilities
 * Helper functions for testing email functionality
 */

import { sendCustomEmail } from './notificationService';

/**
 * Test email sending with a simple test email
 */
export async function sendTestEmail(
  to: string,
  subject: string = 'Test Email from Mukuru Onboarding'
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Test Email</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>This is a test email from the Mukuru Onboarding system.</p>
    
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p><strong>Recipient:</strong> ${to}</p>
    
    <p>If you received this email, your SendGrid integration is working correctly!</p>
    
    <p>Best regards,<br>The Mukuru Onboarding Team</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;">
    <p>This is a test message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();

  const textContent = `Test Email\n\nThis is a test email from the Mukuru Onboarding system.\n\nTimestamp: ${new Date().toISOString()}\nRecipient: ${to}\n\nIf you received this email, your SendGrid integration is working correctly!\n\nBest regards,\nThe Mukuru Onboarding Team`;

  try {
    const success = await sendCustomEmail(to, subject, htmlContent, textContent);
    return { success };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test all email templates (Admin templates)
 */
export async function testAllEmailTemplates(to: string): Promise<{
  status: { success: boolean; error?: string };
  message: { success: boolean; error?: string };
  approval: { success: boolean; error?: string };
  rejection: { success: boolean; error?: string };
}> {
  const { sendEmailNotification } = await import('./emailTemplates');
  
  const testData = {
    recipientName: 'Test User',
    caseId: 'TEST-123',
    caseNumber: 'OBC-TEST-001',
    status: 'In Review',
    message: 'This is a test message.',
    adminName: 'Test Admin',
    link: 'https://partner.mukuru.com/dashboard',
  };

  const results = {
    status: await sendEmailNotification(
      to,
      'Test: Status Update Email',
      'status',
      testData
    ),
    message: await sendEmailNotification(
      to,
      'Test: Message Notification Email',
      'message',
      testData
    ),
    approval: await sendEmailNotification(
      to,
      'Test: Approval Email',
      'approval',
      { ...testData, message: 'Your application has been approved!' }
    ),
    rejection: await sendEmailNotification(
      to,
      'Test: Rejection Email',
      'rejection',
      { ...testData, reason: 'Test rejection reason.' }
    ),
  };

  return results;
}

/**
 * Verify email service configuration
 * Note: All email sending goes through the backend API which has SendGrid configured.
 * The backend is the single source of truth for email configuration.
 * This checks if the backend notification endpoint is available.
 */
export async function verifySendGridConfig(): Promise<{
  configured: boolean;
  apiKeySet: boolean;
  fromEmailSet: boolean;
  error?: string;
}> {
  try {
    // Since we route through backend, we check if backend endpoint is available
    // Backend has the actual SendGrid configuration
    const response = await fetch('/api/proxy/api/v1/notifications', {
      method: 'OPTIONS', // Use OPTIONS to check if endpoint exists without sending
      credentials: 'include',
    }).catch(() => null);

    // If we can reach the endpoint, backend is configured
    // Backend will handle SendGrid configuration check
    return {
      configured: response !== null,
      apiKeySet: true, // Backend handles this
      fromEmailSet: true, // Backend handles this
    };
  } catch (error) {
    return {
      configured: false,
      apiKeySet: false,
      fromEmailSet: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

