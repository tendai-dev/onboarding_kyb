import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signalRService } from '../signalRService';

// Mock @microsoft/signalr
const mockConnection = {
  state: 'Disconnected',
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
};

const mockHubConnectionBuilder = {
  withUrl: vi.fn().mockReturnThis(),
  withAutomaticReconnect: vi.fn().mockReturnThis(),
  configureLogging: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue(mockConnection),
};

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => mockHubConnectionBuilder),
  HubConnectionState: {
    Connected: 'Connected',
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
  },
  LogLevel: {
    Information: 2,
  },
}));

// Mock session and api
vi.mock('../auth/session', () => ({
  getAuthUser: vi.fn(() => ({ email: 'test@example.com', name: 'Test User' })),
}));

vi.mock('../api', () => ({
  generateUserIdFromEmail: vi.fn(() => 'test-user-id'),
}));

describe('signalRService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection.state = 'Disconnected';
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:8001';
  });

  it('should have signalR service methods', () => {
    expect(signalRService).toBeDefined();
    expect(signalRService.connect).toBeDefined();
    expect(signalRService.disconnect).toBeDefined();
    expect(signalRService.on).toBeDefined();
    expect(signalRService.joinThread).toBeDefined();
    expect(signalRService.leaveThread).toBeDefined();
    expect(signalRService.isConnected).toBeDefined();
    expect(signalRService.getConnectionState).toBeDefined();
  });

  it('should connect', async () => {
    mockConnection.state = 'Disconnected';
    await signalRService.connect();
    expect(mockConnection.start).toHaveBeenCalled();
  });

  it('should not reconnect if already connected', async () => {
    mockConnection.state = 'Connected';
    await signalRService.connect();
    expect(mockConnection.start).not.toHaveBeenCalled();
  });

  it('should disconnect', async () => {
    mockConnection.state = 'Connected';
    await signalRService.disconnect();
    expect(mockConnection.stop).toHaveBeenCalled();
  });

  it('should register event listener', () => {
    const handler = vi.fn();
    const unsubscribe = signalRService.on('ReceiveMessage', handler);
    expect(typeof unsubscribe).toBe('function');
  });

  it('should join thread', async () => {
    mockConnection.state = 'Connected';
    await signalRService.joinThread('12345678-1234-1234-1234-123456789abc');
    expect(mockConnection.invoke).toHaveBeenCalledWith('JoinThread', expect.any(String));
  });

  it('should not join thread with invalid GUID', async () => {
    mockConnection.state = 'Connected';
    await signalRService.joinThread('invalid-thread-id');
    expect(mockConnection.invoke).not.toHaveBeenCalled();
  });

  it('should leave thread', async () => {
    mockConnection.state = 'Connected';
    await signalRService.leaveThread('12345678-1234-1234-1234-123456789abc');
    expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveThread', expect.any(String));
  });

  it('should handle connection errors gracefully', async () => {
    mockConnection.start.mockRejectedValueOnce(new Error('Connection failed'));
    await signalRService.start();
    // Should not throw - errors are handled internally
    expect(mockConnection.start).toHaveBeenCalled();
  });

  it('should set up event handlers', async () => {
    await signalRService.start();
    expect(mockConnection.on).toHaveBeenCalled();
  });

  it('should use correct hub URL', async () => {
    await signalRService.start();
    expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/messages/hub'),
      expect.any(Object)
    );
  });

  it('should include user headers in connection', async () => {
    await signalRService.start();
    const callArgs = mockHubConnectionBuilder.withUrl.mock.calls[0];
    expect(callArgs[1].headers).toHaveProperty('X-User-Email');
    expect(callArgs[1].headers).toHaveProperty('X-User-Id');
  });

  it('should check connection state', () => {
    mockConnection.state = 'Connected';
    const isConnected = signalRService.isConnected();
    expect(typeof isConnected).toBe('boolean');
  });

  it('should get connection state', () => {
    const state = signalRService.getConnectionState();
    expect(state).toBeDefined();
  });

  it('should handle sendTypingIndicator', async () => {
    mockConnection.state = 'Connected';
    await signalRService.sendTypingIndicator('12345678-1234-1234-1234-123456789abc');
    expect(mockConnection.invoke).toHaveBeenCalledWith('UserTyping', expect.any(String));
  });

  it('should handle event listeners', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    const unsubscribe1 = signalRService.on('ReceiveMessage', handler1);
    const unsubscribe2 = signalRService.on('ReceiveMessage', handler2);
    
    expect(typeof unsubscribe1).toBe('function');
    expect(typeof unsubscribe2).toBe('function');
    
    unsubscribe1();
    unsubscribe2();
  });
});

