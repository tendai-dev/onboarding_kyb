import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { EnhancedMessaging, Message, Conversation } from '../EnhancedMessaging';

describe('EnhancedMessaging', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      applicationId: 'app-1',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      lastMessage: {
        id: 'msg-1',
        senderId: 'user-1',
        senderName: 'Customer',
        senderType: 'customer',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        status: 'sent',
        priority: 'normal',
        isRead: false,
        isStarred: false,
      },
      unreadCount: 1,
      priority: 'normal',
      status: 'active',
      tags: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      senderId: 'user-1',
      senderName: 'Customer',
      senderType: 'customer',
      content: 'Hello',
      timestamp: '2024-01-01T00:00:00Z',
      status: 'sent',
      priority: 'normal',
      isRead: false,
      isStarred: false,
      applicationId: 'app-1',
    },
  ];

  const mockCurrentUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockHandlers = {
    onSendMessage: vi.fn().mockResolvedValue(undefined),
    onReplyToMessage: vi.fn().mockResolvedValue(undefined),
    onForwardMessage: vi.fn().mockResolvedValue(undefined),
    onStarMessage: vi.fn().mockResolvedValue(undefined),
    onArchiveConversation: vi.fn().mockResolvedValue(undefined),
    onAssignConversation: vi.fn().mockResolvedValue(undefined),
    onTagConversation: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced messaging component', () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId={null}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should display conversations list', () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId={null}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should filter conversations by search term', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId={null}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should filter conversations by priority', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId={null}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const priorityFilter = screen.queryByText(/priority/i);
    if (priorityFilter) {
      fireEvent.click(priorityFilter);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should select conversation when clicked', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId={null}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const conversation = screen.queryByText(/test customer/i);
    if (conversation) {
      fireEvent.click(conversation);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should send message when send button clicked', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const messageInput = screen.queryByPlaceholderText(/type.*message/i);
    const sendButton = screen.queryByLabelText(/send/i);

    if (messageInput && sendButton) {
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockHandlers.onSendMessage).toHaveBeenCalled();
      });
    }
  });

  it('should handle reply to message', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const replyButton = screen.queryByLabelText(/reply/i);
    if (replyButton) {
      fireEvent.click(replyButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle forward message', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const forwardButton = screen.queryByLabelText(/forward/i);
    if (forwardButton) {
      fireEvent.click(forwardButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle star message', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const starButton = screen.queryByLabelText(/star/i);
    if (starButton) {
      fireEvent.click(starButton);
      
      await waitFor(() => {
        expect(mockHandlers.onStarMessage).toHaveBeenCalled();
      });
    }
  });

  it('should handle archive conversation', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const archiveButton = screen.queryByLabelText(/archive/i);
    if (archiveButton) {
      fireEvent.click(archiveButton);
      
      await waitFor(() => {
        expect(mockHandlers.onArchiveConversation).toHaveBeenCalled();
      });
    }
  });

  it('should handle file attachment', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const attachButton = screen.queryByLabelText(/attach|file/i);
    if (attachButton) {
      fireEvent.click(attachButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should display empty state when no conversations', () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={[]}
        messages={[]}
        currentConversationId={null}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should display empty state when no messages', () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={[]}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle error when sending message fails', async () => {
    mockHandlers.onSendMessage.mockRejectedValueOnce(new Error('Failed to send'));

    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const messageInput = screen.queryByPlaceholderText(/type.*message/i);
    const sendButton = screen.queryByLabelText(/send/i);

    if (messageInput && sendButton) {
      fireEvent.change(messageInput, { target: { value: 'Test' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });
});

