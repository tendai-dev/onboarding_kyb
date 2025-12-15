/**
 * Email templates for various notification types
 * These templates generate HTML and text content that is sent via the backend API.
 * The backend API handles all email delivery using SendGrid.
 */

export interface EmailTemplateData {
  applicantName?: string;
  caseId?: string;
  caseNumber?: string;
  status?: string;
  message?: string;
  link?: string;
  companyName?: string;
  [key: string]: any;
}

/**
 * Generate welcome email HTML content
 */
export function generateWelcomeEmail(data: EmailTemplateData): string {
  const { applicantName = 'Valued Partner', caseId, caseNumber } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Mukuru Onboarding</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Welcome to Mukuru Onboarding</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${applicantName},</p>
    
    <p>Thank you for starting your onboarding process with Mukuru. We're excited to have you on board!</p>
    
    <p>Your application has been created with case ID: <strong>${displayCaseId}</strong></p>
    
    <p>You can track your application progress at any time through your partner dashboard.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.link || 'https://partner.mukuru.com/dashboard'}" 
         style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Dashboard
      </a>
    </div>
    
    <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
    
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
 * Generate status update email HTML content
 */
export function generateStatusUpdateEmail(data: EmailTemplateData): string {
  const { applicantName = 'Valued Partner', caseId, caseNumber, status, message } = data;
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
    <p>Dear ${applicantName},</p>
    
    <p>Your onboarding case <strong>${displayCaseId}</strong> status has been updated.</p>
    
    <div style="background-color: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0;">
      <p style="margin: 0;"><strong>New Status:</strong> ${status || 'Updated'}</p>
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
 * Generate acknowledgement request email HTML content
 */
export function generateAcknowledgementEmail(data: EmailTemplateData): string {
  const { applicantName = 'Valued Partner', caseId, caseNumber, link } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Acknowledgement Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Final Acknowledgement Required</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${applicantName},</p>
    
    <p>Your onboarding case <strong>${displayCaseId}</strong> is almost complete!</p>
    
    <p>Before we can finalize your application, we need you to review and sign the final acknowledgement form. This confirms that:</p>
    
    <ul style="line-height: 2;">
      <li>All information provided is accurate and complete</li>
      <li>You agree to the relevant legal and product terms</li>
      <li>You understand your obligations and responsibilities</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link || 'https://partner.mukuru.com/acknowledgement'}" 
         style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
        Sign Acknowledgement
      </a>
    </div>
    
    <p>If you have any questions, please contact our support team.</p>
    
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
 * Generate message notification email HTML content
 */
export function generateMessageNotificationEmail(data: EmailTemplateData): string {
  const { applicantName = 'Valued Partner', caseId, caseNumber, message, senderName } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FF6B35; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Message</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px;">
    <p>Dear ${applicantName},</p>
    
    <p>You have received a new message regarding case <strong>${displayCaseId}</strong>.</p>
    
    ${senderName ? `<p><strong>From:</strong> ${senderName}</p>` : ''}
    
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
 * Generate plain text version of email (fallback)
 */
export function generatePlainTextEmail(data: EmailTemplateData, type: 'welcome' | 'status' | 'acknowledgement' | 'message'): string {
  const { applicantName = 'Valued Partner', caseId, caseNumber, status, message } = data;
  const displayCaseId = caseNumber || caseId || 'your case';

  switch (type) {
    case 'welcome':
      return `Dear ${applicantName},\n\nThank you for starting your onboarding process with Mukuru. Your application has been created with case ID: ${displayCaseId}.\n\nYou can track your progress at: ${data.link || 'https://partner.mukuru.com/dashboard'}\n\nBest regards,\nThe Mukuru Onboarding Team`;

    case 'status':
      return `Dear ${applicantName},\n\nYour onboarding case ${displayCaseId} status has been updated to: ${status || 'Updated'}.\n\n${message || ''}\n\nView your application: ${data.link || 'https://partner.mukuru.com/dashboard'}\n\nBest regards,\nThe Mukuru Onboarding Team`;

    case 'acknowledgement':
      return `Dear ${applicantName},\n\nYour onboarding case ${displayCaseId} is almost complete! Please review and sign the final acknowledgement form.\n\nSign here: ${data.link || 'https://partner.mukuru.com/acknowledgement'}\n\nBest regards,\nThe Mukuru Onboarding Team`;

    case 'message':
      return `Dear ${applicantName},\n\nYou have received a new message regarding case ${displayCaseId}.\n\n${message || 'No message content'}\n\nView message: ${data.link || 'https://partner.mukuru.com/messages'}\n\nBest regards,\nThe Mukuru Onboarding Team`;

    default:
      return `Dear ${applicantName},\n\nThis is a notification regarding case ${displayCaseId}.\n\nBest regards,\nThe Mukuru Onboarding Team`;
  }
}

/**
 * Send email notification using the API
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  type: 'welcome' | 'status' | 'acknowledgement' | 'message',
  templateData: EmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    let htmlContent: string;
    let textContent: string;

    switch (type) {
      case 'welcome':
        htmlContent = generateWelcomeEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'welcome');
        break;
      case 'status':
        htmlContent = generateStatusUpdateEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'status');
        break;
      case 'acknowledgement':
        htmlContent = generateAcknowledgementEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'acknowledgement');
        break;
      case 'message':
        htmlContent = generateMessageNotificationEmail(templateData);
        textContent = generatePlainTextEmail(templateData, 'message');
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
        type: type === 'welcome' ? 'Welcome' : type === 'status' ? 'StatusUpdate' : type === 'acknowledgement' ? 'StatusUpdate' : 'Other',
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
