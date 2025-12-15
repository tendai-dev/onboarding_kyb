import * as signalR from '@microsoft/signalr';
import { getAuthUser } from './auth/session';
import { generateUserIdFromEmail } from './api';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: unknown) => void>> =
    new Map();
  private currentThreadId: string | null = null;
  private lastHeartbeat: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      // Get user info for connection
      const user = getAuthUser();
      const userEmail = user.email || '';

      // Generate user ID from email (consistent with backend)
      const userId = generateUserIdFromEmail(userEmail);

      // Build connection URL directly to backend (bypassing Next.js proxy)
      // Next.js API routes don't support WebSocket connections, so SignalR must connect directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const hubUrl = `${backendUrl}/api/v1/messages/hub`;
      
      console.info('[SignalR] Connecting to hub:', hubUrl);
      console.info('[SignalR] User info:', { userEmail, userName: user.name, userId: userId ? userId.substring(0, 8) + '...' : 'none' });

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          // For direct backend connection, we need to handle auth differently
          // The backend will use X-User-Id header for identification
          accessTokenFactory: async () => {
            // Return empty - backend uses headers for user identification
            return '';
          },
          headers: {
            'X-User-Email': userEmail,
            'X-User-Name': user.name || userEmail,
            'X-User-Role': 'Applicant',
            'X-User-Id': userId.toString(),
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null; // Stop reconnecting
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      console.info('[SignalR] Connected to messaging hub');

      this.reconnectAttempts = 0;
      this.lastHeartbeat = Date.now();
      
      // Start heartbeat to detect stale connections
      this.startHeartbeat();
      
      // Rejoin thread if we were in one before reconnecting
      if (this.currentThreadId) {
        this.joinThread(this.currentThreadId).catch(() => {});
      }
    } catch (error) {
      // SignalR is optional - messaging will work without real-time updates
      console.warn('[SignalR] Connection failed (non-critical):', error);
      console.warn('[SignalR] Messaging will work without real-time updates');
      this.reconnectAttempts++;
      // Don't throw - allow messaging to work without SignalR
      // The connection will remain null and isConnected() will return false
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle new messages
    this.connection.on('ReceiveMessage', (message: unknown) => {
      console.info('[SignalR] Received message:', message);
      this.notifyListeners('ReceiveMessage', message);
    });

    // Handle message sent confirmation
    this.connection.on('MessageSent', (message: unknown) => {
      console.info('[SignalR] Message sent:', message);
      this.notifyListeners('MessageSent', message);
    });

    // Handle message errors
    this.connection.on('MessageError', (error: unknown) => {
      console.error('[SignalR] Message error:', error);
      this.notifyListeners('MessageError', error);
    });

    // Handle typing indicators
    this.connection.on('UserTyping', (data: unknown) => {
      this.notifyListeners('UserTyping', data);
    });

    // Handle message read receipts
    this.connection.on('MessageRead', (messageId: unknown) => {
      this.notifyListeners('MessageRead', messageId);
    });

    // Handle connection state changes
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Reconnecting...', error);
      this.notifyListeners('Reconnecting', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.info('[SignalR] Reconnected:', connectionId);
      this.notifyListeners('Reconnected', connectionId);
    });

    this.connection.onclose((error) => {
      console.error('[SignalR] Connection closed:', error);
      this.notifyListeners('ConnectionClosed', error);
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.listeners.clear();
      console.info('[SignalR] Disconnected');
    }
  }

  async joinThread(threadId: string): Promise<void> {
    // Store current thread for reconnection
    this.currentThreadId = threadId;
    
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      // Validate threadId is a valid GUID before calling
      if (!threadId || threadId === '00000000-0000-0000-0000-000000000000') {
        console.warn('[SignalR] Invalid threadId provided to JoinThread:', threadId);
        return;
      }

      try {
        // Ensure threadId is a valid GUID string
        const guidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(threadId)) {
          console.warn('[SignalR] threadId is not a valid GUID:', threadId);
          return;
        }

        // Try both PascalCase and camelCase for compatibility with different backend versions
        try {
          await this.connection.invoke('JoinThread', threadId);
        } catch {
          await this.connection.invoke('joinThread', threadId);
        }
        console.info('[SignalR] Joined thread:', threadId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Method doesn't exist on server - this is expected if backend doesn't implement it yet
        if (
          errorMessage.includes('Method does not exist') ||
          errorMessage.includes('HubException')
        ) {
          console.debug(
            '[SignalR] JoinThread method not available on server (non-critical)'
          );
          // Don't throw - allow messaging to continue without thread-specific updates
        } else {
          console.error('[SignalR] Failed to join thread:', threadId, error);
          // Only throw for non-method-missing errors
          throw error;
        }
      }
    }
  }

  async leaveThread(threadId: string): Promise<void> {
    // Clear current thread
    if (this.currentThreadId === threadId) {
      this.currentThreadId = null;
    }
    
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        // Try both PascalCase and camelCase for compatibility
        try {
          await this.connection.invoke('LeaveThread', threadId);
        } catch {
          await this.connection.invoke('leaveThread', threadId);
        }
      } catch (error) {
        // Method doesn't exist on server - this is expected if backend doesn't implement it
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('Method does not exist') ||
          errorMessage.includes('HubException')
        ) {
          console.debug(
            '[SignalR] LeaveThread method not available on server (non-critical)'
          );
        } else {
          console.warn('[SignalR] Failed to leave thread:', threadId, error);
        }
      }
    }
  }

  async sendTypingIndicator(threadId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('UserTyping', threadId);
    }
  }

  on<T = unknown>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const typedCallback = callback as (data: unknown) => void;
    this.listeners.get(event)!.add(typedCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(typedCallback);
    };
  }

  private notifyListeners(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SignalR] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }
  
  // Get time since last heartbeat (for connection health monitoring)
  getTimeSinceLastHeartbeat(): number {
    return Date.now() - this.lastHeartbeat;
  }
  
  // Check if connection is healthy (connected and recent heartbeat)
  isHealthy(): boolean {
    return this.isConnected() && this.getTimeSinceLastHeartbeat() < 60000;
  }
  
  // Start heartbeat interval to detect stale connections
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        this.lastHeartbeat = Date.now();
      } else {
        // Connection lost, try to reconnect
        console.warn('[SignalR] Heartbeat detected disconnection, attempting reconnect...');
        this.connect().catch(() => {});
      }
    }, 15000); // Check every 15 seconds
  }
  
  // Stop heartbeat interval
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // Force reconnection
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
  
  // Get current thread ID
  getCurrentThreadId(): string | null {
    return this.currentThreadId;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;
