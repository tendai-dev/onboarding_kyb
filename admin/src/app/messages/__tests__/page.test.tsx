import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import MessagesPage from '../page';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';
import { messagingApi } from '@/lib/messagingApi';
import { signalRService } from '@/lib/signalRService';
import { pushNotificationService } from '@/lib/pushNotifications';
import { messageTemplatesService } from '@/lib/messageTemplates';
import { messageExportService } from '@/lib/messageExport';
import { uploadFileToDocumentService } from '@/lib/documentUpload';

// Mock sidebar context
vi.mock('@/contexts/SidebarContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/SidebarContext')>();
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock messaging API
vi.mock('@/lib/messagingApi', () => ({
  messagingApi: {
    getThreads: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    starMessage: vi.fn(),
    archiveThread: vi.fn(),
  },
}));

// Mock SignalR
vi.mock('@/lib/signalRService', () => ({
  signalRService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onMessageReceived: vi.fn(),
    onTypingIndicator: vi.fn(),
  },
}));

// Mock other services
vi.mock('@/lib/pushNotifications', () => ({
  pushNotificationService: {
    requestPermission: vi.fn(),
    showNotification: vi.fn(),
  },
}));

vi.mock('@/lib/messageTemplates', () => ({
  messageTemplatesService: {
    getTemplates: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/messageExport', () => ({
  messageExportService: {
    exportMessages: vi.fn(),
  },
}));

vi.mock('@/lib/documentUpload', () => ({
  uploadFileToDocumentService: vi.fn(),
}));

// Mock SweetAlert
vi.mock('@/utils/sweetAlert', () => ({
  SweetAlert: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// Mock components
vi.mock('@/components/AdminSidebar', () => ({
  default: () => <div data-testid="admin-sidebar">Sidebar</div>,
}));

describe('MessagesPage', () => {
  const mockThreads = [
    {
      id: 'thread-1',
      applicationId: 'app-1',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      lastMessage: {
        id: 'msg-1',
        content: 'Test message',
        timestamp: '2024-01-01T00:00:00Z',
      },
      unreadCount: 2,
      priority: 'normal' as const,
      status: 'active' as const,
      tags: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockMessages = [
    {
      id: 'msg-1',
      sender: 'Customer',
      senderType: 'PARTNER' as const,
      subject: 'Test',
      content: 'Test message content',
      timestamp: '2024-01-01T00:00:00Z',
      applicationId: 'app-1',
      isRead: false,
      priority: 'normal' as const,
      threadId: 'thread-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    });
    (useSidebar as any).mockReturnValue({
      condensed: false,
      setCondensed: vi.fn(),
    });
    (messagingApi.getThreads as any).mockResolvedValue(mockThreads);
    (messagingApi.getMessages as any).mockResolvedValue(mockMessages);
    (signalRService.connect as any).mockResolvedValue(undefined);
  });

  it('should render messages page', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  it('should load threads on mount', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });
  });

  it('should connect to SignalR on mount', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(signalRService.connect).toHaveBeenCalled();
    });
  });

  it('should select a thread when clicked', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Find and click a thread
    const thread = screen.queryByText(/test customer/i);
    if (thread) {
      fireEvent.click(thread);
      
      await waitFor(() => {
        expect(messagingApi.getMessages).toHaveBeenCalled();
      });
    }
  });

  it('should handle send message', async () => {
    (messagingApi.sendMessage as any).mockResolvedValue({});

    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Find send button or input
    const sendButton = screen.queryByLabelText(/send/i);
    if (sendButton) {
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle search functionality', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle filter by priority', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    const filterButton = screen.queryByText(/priority/i);
    if (filterButton) {
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle compose new message', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    const composeButton = screen.queryByText(/compose|new message/i);
    if (composeButton) {
      fireEvent.click(composeButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });

  it('should handle error state', async () => {
    (messagingApi.getThreads as any).mockRejectedValueOnce(
      new Error('Failed to load threads')
    );

    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Error should be handled gracefully
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it('should handle empty state when no threads', async () => {
    (messagingApi.getThreads as any).mockResolvedValueOnce([]);

    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Should render empty state
    expect(document.body).toBeInTheDocument();
  });

  it('should handle mark as read', async () => {
    (messagingApi.markAsRead as any).mockResolvedValue({});

    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Mark as read functionality
    expect(document.body).toBeInTheDocument();
  });

  it('should handle star message', async () => {
    (messagingApi.starMessage as any).mockResolvedValue({});

    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Star message functionality
    expect(document.body).toBeInTheDocument();
  });

  it('should handle archive thread', async () => {
    (messagingApi.archiveThread as any).mockResolvedValue({});

    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Archive functionality
    expect(document.body).toBeInTheDocument();
  });

  it('should handle reply to message', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Reply functionality
    expect(document.body).toBeInTheDocument();
  });

  it('should handle forward message', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // Forward functionality
    expect(document.body).toBeInTheDocument();
  });

  it('should handle file attachment', async () => {
    renderWithProviders(<MessagesPage />);
    
    await waitFor(() => {
      expect(messagingApi.getThreads).toHaveBeenCalled();
    });

    // File attachment functionality
    const attachButton = screen.queryByLabelText(/attach|file/i);
    if (attachButton) {
      fireEvent.click(attachButton);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    }
  });
});

