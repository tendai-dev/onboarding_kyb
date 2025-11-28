import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { EnhancedContextualMessaging } from '../EnhancedContextualMessaging';

describe('EnhancedContextualMessaging', () => {
  const mockConversations = [
    {
      id: 'conv-1',
      applicationId: 'app-1',
      lastMessage: {
        content: 'Test message',
        timestamp: new Date().toISOString(),
      },
      unreadCount: 2,
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    onSendMessage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    const { container } = renderWithProviders(<EnhancedContextualMessaging {...defaultProps} />);
    // Component should render without crashing
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeTruthy();
  });

  it('should render with conversations', () => {
    const { container } = renderWithProviders(<EnhancedContextualMessaging {...defaultProps} />);
    // Component should render
    expect(container).toBeInTheDocument();
  });

  it('should handle empty conversations', () => {
    const { container } = renderWithProviders(<EnhancedContextualMessaging {...defaultProps} conversations={[]} />);
    // Component should render even with empty conversations
    expect(container).toBeInTheDocument();
  });
});

