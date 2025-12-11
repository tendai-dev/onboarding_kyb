import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/testUtils';
import { EnhancedContextualMessaging } from '../EnhancedContextualMessaging';

describe('EnhancedContextualMessaging', () => {
  const mockConversations = [
    {
      id: 'conv-1',
      applicationId: 'app-1',
      partnerId: 'partner-1',
      subject: 'Test Conversation',
      status: 'active' as const,
      priority: 'normal' as const,
      lastMessage: 'Test message',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 2,
      tags: [],
      createdAt: new Date().toISOString(),
      contextSections: [],
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    messages: [],
    currentUser: { id: 'user-1', name: 'Test User', type: 'partner' as const },
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

  it('should render component', () => {
    const { container } = renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <EnhancedContextualMessaging {...defaultProps} />
    );
    // Component should render without crashing
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeTruthy();
  });

  it('should render with conversations', () => {
    const { container } = renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <EnhancedContextualMessaging {...defaultProps} />
    );
    // Component should render
    expect(container).toBeInTheDocument();
  });

  it('should handle empty conversations', () => {
    const { container } = renderWithProviders(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <EnhancedContextualMessaging {...defaultProps} conversations={[]} />
    );
    // Component should render even with empty conversations
    expect(container).toBeInTheDocument();
  });
});
