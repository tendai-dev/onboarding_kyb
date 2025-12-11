import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import CustomerMessagesPage from '../page';
import * as api from '@/lib/api';
import { getAuthUser } from '@/lib/auth/session';
import { signalRService } from '@/lib/signalRService';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/lib/auth/session');
vi.mock('@/lib/signalRService', () => ({
  signalRService: {
    connect: vi.fn(),
    start: vi.fn(),
    disconnect: vi.fn(),
    onMessageReceived: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('@/components/EnhancedContextualMessaging', () => ({
  EnhancedContextualMessaging: ({ conversations, onSendMessage }: unknown) => (
    <div data-testid="enhanced-contextual-messaging">
      <div data-testid="conversations-count">{conversations?.length || 0}</div>
      <button data-testid="send-message" onClick={() => onSendMessage('test', [])}>
        Send
      </button>
    </div>
  ),
}));

describe('CustomerMessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAuthUser as unknown).mockReturnValue({
      name: 'Test User',
      email: 'test@example.com',
    });
    (api.getMyThreads as unknown).mockResolvedValue([]);
    (api.getUnreadCount as unknown).mockResolvedValue(0);
    (api.findUserCaseByEmail as unknown).mockResolvedValue({ caseId: 'test-case' });
  });

  it('should render messages page', () => {
    renderWithProviders(<CustomerMessagesPage />);
    expect(screen.getByTestId('enhanced-contextual-messaging')).toBeInTheDocument();
  });

  it('should load threads on mount', async () => {
    renderWithProviders(<CustomerMessagesPage />);

    await waitFor(() => {
      expect(api.getMyThreads).toHaveBeenCalled();
    });
  });

  it('should load unread count on mount', async () => {
    renderWithProviders(<CustomerMessagesPage />);

    await waitFor(() => {
      expect(api.getUnreadCount).toHaveBeenCalled();
    });
  });

  it('should start SignalR connection on mount', async () => {
    renderWithProviders(<CustomerMessagesPage />);

    await waitFor(() => {
      expect(signalRService.connect).toHaveBeenCalled();
    });
  });

  it('should handle send message', async () => {
    (api.sendMessage as unknown).mockResolvedValue({});

    renderWithProviders(<CustomerMessagesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('send-message')).toBeInTheDocument();
    });

    const sendButton = screen.getByTestId('send-message');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(api.sendMessage).toHaveBeenCalled();
    });
  });
});
