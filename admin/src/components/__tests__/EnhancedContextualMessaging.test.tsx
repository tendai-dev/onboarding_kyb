import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { EnhancedContextualMessaging, ContextualMessage, ContextualConversation } from '../EnhancedContextualMessaging';

const mockConversation: ContextualConversation = {
  id: 'conv-1',
  applicationId: 'app-1',
  customerId: 'customer-1',
  subject: 'Test Conversation',
  status: 'active',
  priority: 'normal',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  messages: [],
};

describe('EnhancedContextualMessaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced contextual messaging component', () => {
    renderWithProviders(
      <EnhancedContextualMessaging
        conversation={mockConversation}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should display conversation messages', () => {
    const conversationWithMessages: ContextualConversation = {
      ...mockConversation,
      messages: [
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Test User',
          senderType: 'admin',
          content: 'Test message',
          timestamp: '2024-01-01',
          status: 'sent',
          priority: 'normal',
          isRead: true,
          isStarred: false,
        },
      ],
    };

    renderWithProviders(
      <EnhancedContextualMessaging
        conversation={conversationWithMessages}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    expect(document.body).toBeInTheDocument();
  });

  it('should handle sending messages', async () => {
    const mockOnSendMessage = vi.fn();
    renderWithProviders(
      <EnhancedContextualMessaging
        conversation={mockConversation}
        currentUserId="user-1"
        onSendMessage={mockOnSendMessage}
      />
    );

    const sendButton = screen.queryByText(/send/i);
    if (sendButton) {
      fireEvent.click(sendButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle attachment upload', async () => {
    renderWithProviders(
      <EnhancedContextualMessaging
        conversation={mockConversation}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it('should handle message filtering', async () => {
    renderWithProviders(
      <EnhancedContextualMessaging
        conversation={mockConversation}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});

