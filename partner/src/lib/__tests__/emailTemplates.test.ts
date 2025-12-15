/**
 * Tests for email templates
 */

import {
  generateWelcomeEmail,
  generateStatusUpdateEmail,
  generateAcknowledgementEmail,
  generateMessageNotificationEmail,
  generatePlainTextEmail,
} from '../emailTemplates';

describe('Email Templates', () => {
  const mockData = {
    applicantName: 'John Doe',
    caseId: 'CASE-123',
    caseNumber: 'OBC-2024-001',
    link: 'https://partner.mukuru.com/dashboard',
  };

  describe('generateWelcomeEmail', () => {
    it('should generate welcome email HTML', () => {
      const html = generateWelcomeEmail(mockData);
      expect(html).toContain('Welcome to Mukuru Onboarding');
      expect(html).toContain('John Doe');
      expect(html).toContain('OBC-2024-001');
      expect(html).toContain('https://partner.mukuru.com/dashboard');
    });

    it('should handle missing data gracefully', () => {
      const html = generateWelcomeEmail({});
      expect(html).toContain('Valued Partner');
      expect(html).toContain('your case');
    });
  });

  describe('generateStatusUpdateEmail', () => {
    it('should generate status update email HTML', () => {
      const html = generateStatusUpdateEmail({
        ...mockData,
        status: 'In Review',
        message: 'Your application is being reviewed.',
      });
      expect(html).toContain('Application Status Update');
      expect(html).toContain('In Review');
      expect(html).toContain('Your application is being reviewed.');
    });
  });

  describe('generateAcknowledgementEmail', () => {
    it('should generate acknowledgement email HTML', () => {
      const html = generateAcknowledgementEmail(mockData);
      expect(html).toContain('Final Acknowledgement Required');
      expect(html).toContain('Sign Acknowledgement');
    });
  });

  describe('generateMessageNotificationEmail', () => {
    it('should generate message notification email HTML', () => {
      const html = generateMessageNotificationEmail({
        ...mockData,
        message: 'You have a new message.',
        senderName: 'Support Team',
      });
      expect(html).toContain('New Message');
      expect(html).toContain('You have a new message.');
      expect(html).toContain('Support Team');
    });
  });

  describe('generatePlainTextEmail', () => {
    it('should generate plain text welcome email', () => {
      const text = generatePlainTextEmail(mockData, 'welcome');
      expect(text).toContain('John Doe');
      expect(text).toContain('OBC-2024-001');
      expect(text).not.toContain('<html>');
    });

    it('should generate plain text status update email', () => {
      const text = generatePlainTextEmail(
        { ...mockData, status: 'Approved' },
        'status'
      );
      expect(text).toContain('Approved');
    });
  });
});

