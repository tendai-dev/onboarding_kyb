'use client';

import { useEffect } from 'react';
import { sendAcknowledgementNotification } from '@/lib/notificationService';

interface AcknowledgementEmailNotificationProps {
  application: {
    id?: string;
    caseId?: string;
    caseNumber?: string;
    status?: string;
  };
  userEmail?: string;
  userName?: string;
  onEmailSent: () => void;
  emailSent: boolean;
}

/**
 * Component that sends acknowledgement email notification when application is completed
 * This is a separate component to handle the side effect cleanly
 */
export function AcknowledgementEmailNotification({
  application,
  userEmail,
  userName,
  onEmailSent,
  emailSent,
}: AcknowledgementEmailNotificationProps) {
  useEffect(() => {
    // Only send email once when application becomes COMPLETED
    if (
      !emailSent &&
      userEmail &&
      (application.status === 'COMPLETED' || application.status === 'COMPLETE')
    ) {
      const sendEmail = async () => {
        try {
          const success = await sendAcknowledgementNotification({
            to: userEmail,
            applicantName: userName || 'Valued Partner',
            caseId: application.id || application.caseId,
            caseNumber: application.caseNumber || application.caseId,
            applicationId: application.id || application.caseId || '',
            link: `${window.location.origin}/partner/acknowledgement/${application.id || application.caseId}`,
          });

          if (success) {
            onEmailSent();
            console.info('Acknowledgement email sent successfully');
          } else {
            console.warn('Failed to send acknowledgement email');
          }
        } catch (error) {
          // Log error but don't block user flow
          console.warn('Error sending acknowledgement email:', error);
        }
      };

      // Send email after a short delay to ensure page is loaded
      const timer = setTimeout(sendEmail, 1000);
      return () => clearTimeout(timer);
    }
  }, [application, userEmail, userName, emailSent, onEmailSent]);

  // This component doesn't render anything
  return null;
}

