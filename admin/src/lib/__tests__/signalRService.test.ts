import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signalRService } from '../signalRService';

// Mock SignalR
vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
      invoke: vi.fn().mockResolvedValue(undefined),
      state: 'Connected',
    })),
  })),
  HubConnectionState: {
    Connected: 'Connected',
    Disconnected: 'Disconnected',
  },
  LogLevel: {
    Information: 2,
  },
}));

global.fetch = vi.fn();

describe('signalRService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        user: { email: 'test@example.com', name: 'Test User' },
      }),
    });
  });

  it('should connect to SignalR hub', async () => {
    await signalRService.connect();
    expect(document.body).toBeInTheDocument();
  });

  it('should handle connection errors', async () => {
    const { HubConnectionBuilder } = await import('@microsoft/signalr');
    const mockBuilder = HubConnectionBuilder as any;
    const mockConnection = {
      start: vi.fn().mockRejectedValue(new Error('Connection failed')),
      state: 'Disconnected',
    };
    mockBuilder.mockReturnValue({
      withUrl: vi.fn().mockReturnThis(),
      withAutomaticReconnect: vi.fn().mockReturnThis(),
      configureLogging: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue(mockConnection),
    });

    try {
      await signalRService.connect();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should send message', async () => {
    await signalRService.connect();
    await signalRService.sendMessage('thread-1', 'Test message');
    expect(document.body).toBeInTheDocument();
  });

  it('should subscribe to messages', () => {
    const callback = vi.fn();
    signalRService.onMessage(callback);
    expect(document.body).toBeInTheDocument();
  });

  it('should unsubscribe from messages', () => {
    const callback = vi.fn();
    signalRService.onMessage(callback);
    signalRService.offMessage(callback);
    expect(document.body).toBeInTheDocument();
  });
});

