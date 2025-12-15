/**
 * Email templates for admin notifications
 * These templates generate HTML and text content that is sent via the backend API.
 * The backend API handles all email delivery using SendGrid.
 */

export interface EmailTemplateData {
  recipientName?: string;
  caseId?: string;
  caseNumber?: string;
  status?: string;
  message?: string;
  link?: string;
  adminName?: string;
  applicationName?: string;
  [key: string]: any;
}

/**
 * Generate application status change email HTML content (admin to partner)
 */
export function generateStatusChangeEmail(data: EmailTemplateData): string {
  const { recipientName = 'Valued Partner', caseId, caseNumber, status, message, adminName } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Application Status Update</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${recipientName},</p>
    
    <p>Your onboarding case <strong>${displayCaseId}</strong> status has been updated.</p>
    
    <div style="background-color: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0;">
      <p style="margin: 0;"><strong>New Status:</strong> ${status || 'Updated'}</p>
      ${adminName ? `<p style="margin: 5px 0 0 0;"><strong>Updated by:</strong> ${adminName}</p>` : ''}
    </div>
    
    ${message ? `<p>${message}</p>` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.link || 'https://partner.mukuru.com/dashboard'}" 
         style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Application
      </a>
    </div>
    
    <p>Best regards,<br>The Mukuru Onboarding Team</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate admin message notification email HTML content
 */
export function generateAdminMessageEmail(data: EmailTemplateData): string {
  const { recipientName = 'Valued Partner', caseId, caseNumber, message, adminName, applicationName } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message from Support</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Message from Support</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${recipientName},</p>
    
    <p>You have received a new message regarding ${applicationName ? `application <strong>${applicationName}</strong>` : `case <strong>${displayCaseId}</strong>`}.</p>
    
    ${adminName ? `<p><strong>From:</strong> ${adminName} (Support Team)</p>` : '<p><strong>From:</strong> Support Team</p>'}
    
    <div style="background-color: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-wrap;">${message || 'No message content'}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.link || 'https://partner.mukuru.com/messages'}" 
         style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Message
      </a>
    </div>
    
    <p>Best regards,<br>The Mukuru Onboarding Team</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate application approval email HTML content
 */
export function generateApprovalEmail(data: EmailTemplateData): string {
  const { recipientName = 'Valued Partner', caseId, caseNumber, adminName, message } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #28a745; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">🎉 Application Approved!</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${recipientName},</p>
    
    <p>We're excited to inform you that your onboarding case <strong>${displayCaseId}</strong> has been approved!</p>
    
    ${message ? `<p>${message}</p>` : '<p>Your application has successfully completed the review process.</p>'}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.link || 'https://partner.mukuru.com/dashboard'}" 
         style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        View Application
      </a>
    </div>
    
    <p>Thank you for your patience during the review process.</p>
    
    <p>Best regards,<br>${adminName || 'The Mukuru Onboarding Team'}</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate application rejection email HTML content
 */
export function generateRejectionEmail(data: EmailTemplateData): string {
  const { recipientName = 'Valued Partner', caseId, caseNumber, adminName, message } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #dc3545; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Application Update</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${recipientName},</p>
    
    <p>We regret to inform you that your onboarding case <strong>${displayCaseId}</strong> has been declined.</p>
    
    ${message ? `<div style="background-color: white; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    </div>` : ''}
    
    <p>If you have any questions or would like to discuss this decision, please contact our support team.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.link || 'https://partner.mukuru.com/dashboard'}" 
         style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Application
      </a>
    </div>
    
    <p>Best regards,<br>${adminName || 'The Mukuru Onboarding Team'}</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;">
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of email (fallback)
 */
export function generatePlainTextEmail(data: EmailTemplateData, type: 'status' | 'message' | 'approval' | 'rejection'): string {
  const { recipientName = 'Valued Partner', caseId, caseNumber, status, message, adminName } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  switch (type) {
    case 'status':
      return `Dear ${recipientName},\n\nYour onboarding case ${displayCaseId} status has been updated to: ${status || 'Updated'}.\n\n${adminName ? `Updated by: ${adminName}\n\n` : ''}${message || ''}\n\nView your application: ${data.link || 'https://partner.mukuru.com/dashboard'}\n\nBest regards,\nThe Mukuru Onboarding Team`;

    case 'message':
      return `Dear ${recipientName},\n\nYou have received a new message regarding case ${displayCaseId}.\n\n${adminName ? `From: ${adminName} (Support Team)\n\n` : 'From: Support Team\n\n'}${message || 'No message content'}\n\nView message: ${data.link || 'https://partner.mukuru.com/messages'}\n\nBest regards,\nThe Mukuru Onboarding Team`;

    case 'approval':
      return `Dear ${recipientName},\n\nWe're excited to inform you that your onboarding case ${displayCaseId} has been approved!\n\n${message || 'Your application has successfully completed the review process.'}\n\nView your application: ${data.link || 'https://partner.mukuru.com/dashboard'}\n\nBest regards,\n${adminName || 'The Mukuru Onboarding Team'}`;

    case 'rejection':
      return `Dear ${recipientName},\n\nWe regret to inform you that your onboarding case ${displayCaseId} has been declined.\n\n${message || ''}\n\nIf you have any questions, please contact our support team.\n\nView your application: ${data.link || 'https://partner.mukuru.com/dashboard'}\n\nBest regards,\n${adminName || 'The Mukuru Onboarding Team'}`;

    default:
      return `Dear ${recipientName},\n\nThis is a notification regarding case ${displayCaseId}.\n\nBest regards,\nThe Mukuru Onboarding Team`;
  }
}

/**
 * Send email notification using the API
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  type: 'status' | 'message' | 'approval' | 'rejection',
  templateData: EmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    let htmlContent: string;
    let textContent: string;

    switch (type) {
      case 'status':
        htmlContent = generateStatusChangeEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'status');
        break;
      case 'message':
        htmlContent = generateAdminMessageEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'message');
        break;
      case 'approval':
        htmlContent = generateApprovalEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'approval');
        break;
      case 'rejection':
        htmlContent = generateRejectionEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'rejection');
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Call backend API via proxy instead of direct SendGrid
    // Backend has SendGrid integrated and is the single source of truth
    const response = await fetch('/api/proxy/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        type: type === 'status' ? 'StatusUpdate' : type === 'message' ? 'Other' : type === 'approval' ? 'CaseApproved' : 'CaseRejected',
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.error || errorData.message || 'Failed to send email';
      
      // Import error handler dynamically to avoid circular dependencies
      const { getUserFriendlyErrorMessage } = await import('./emailErrorHandler');
      const userMessage = getUserFriendlyErrorMessage(new Error(errorMessage));
      
      return { 
        success: false, 
        error: userMessage,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email notification:', error);
    
    // Import error handler dynamically to avoid circular dependencies
    const { getUserFriendlyErrorMessage } = await import('./emailErrorHandler');
    const userMessage = getUserFriendlyErrorMessage(error);
    
    return {
      success: false,
      error: userMessage,
    };
  }
}

