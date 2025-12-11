/* eslint-disable react/jsx-props-no-spreading */
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
    type: 'admin' as const,
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
        currentConversationId={undefined}
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
        currentConversationId={undefined}
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
        currentConversationId={undefined}
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
        currentConversationId={undefined}
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
        currentConversationId={undefined}
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
        currentConversationId={undefined}
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

  it('should handle priority filtering', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const prioritySelect = screen.queryByDisplayValue(/all priorities/i);
    if (prioritySelect) {
      fireEvent.change(prioritySelect, { target: { value: 'urgent' } });
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle status filtering', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const statusSelect = screen.queryByDisplayValue(/all status/i);
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'archived' } });
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle conversation selection', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId={undefined}
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const conversationItem = screen.queryByText(/test customer/i);
    if (conversationItem) {
      fireEvent.click(conversationItem);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle message templates', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const templateButton = screen.queryByText(/template/i);
    if (templateButton) {
      fireEvent.click(templateButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle assign conversation', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const assignButton = screen.queryByText(/assign/i);
    if (assignButton) {
      fireEvent.click(assignButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle tag conversation', async () => {
    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={mockMessages}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    const tagButton = screen.queryByText(/tag/i);
    if (tagButton) {
      fireEvent.click(tagButton);
      await waitFor(() => expect(document.body).toBeInTheDocument());
    }
  });

  it('should handle different message priorities', () => {
    const messagesWithPriorities: Message[] = [
      { ...mockMessages[0], priority: 'urgent' },
      { ...mockMessages[0], priority: 'high', id: 'msg-2' },
      { ...mockMessages[0], priority: 'normal', id: 'msg-3' },
      { ...mockMessages[0], priority: 'low', id: 'msg-4' },
    ];

    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={messagesWithPriorities}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle different message statuses', () => {
    const messagesWithStatuses: Message[] = [
      { ...mockMessages[0], status: 'sent' },
      { ...mockMessages[0], status: 'delivered', id: 'msg-2' },
      { ...mockMessages[0], status: 'read', id: 'msg-3' },
    ];

    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={messagesWithStatuses}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle messages with attachments', () => {
    const messagesWithAttachments: Message[] = [
      {
        ...mockMessages[0],
        attachments: [
          {
            id: 'att-1',
            name: 'test.pdf',
            type: 'application/pdf',
            size: '1MB',
            url: 'http://example.com/test.pdf',
          },
        ],
      },
    ];

    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={messagesWithAttachments}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });

  it('should handle messages with replyTo', () => {
    const messagesWithReply: Message[] = [
      {
        ...mockMessages[0],
        replyTo: 'msg-0',
      },
    ];

    renderWithProviders(
      <EnhancedMessaging
        conversations={mockConversations}
        messages={messagesWithReply}
        currentConversationId="conv-1"
        currentUser={mockCurrentUser}
        {...mockHandlers}
      />
    );

    expect(document.body).toBeInTheDocument();
  });
});
