import * as signalR from "@microsoft/signalr";
import { getAuthUser } from "./auth/session";
import { generateUserIdFromEmail } from "./api";

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      // Get user info for connection
      const user = getAuthUser();
      const userEmail = user.email || "";
      
      // Generate user ID from email (consistent with backend)
      const userId = generateUserIdFromEmail(userEmail);

      // Build connection URL directly to backend (bypassing Next.js proxy)
      // Next.js API routes don't support WebSocket connections, so SignalR must connect directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const hubUrl = `${backendUrl}/api/v1/messages/hub`;
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          // For direct backend connection, we need to handle auth differently
          // The backend will use X-User-Id header for identification
          accessTokenFactory: async () => {
            // Return empty - backend uses headers for user identification
            return "";
          },
          headers: {
            'X-User-Email': userEmail,
            'X-User-Name': user.name || userEmail,
            'X-User-Role': 'Applicant',
            'X-User-Id': userId.toString()
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null; // Stop reconnecting
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      console.log('[SignalR] Connected to messaging hub');

      this.reconnectAttempts = 0;
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
    this.connection.on("ReceiveMessage", (message: any) => {
      console.log('[SignalR] Received message:', message);
      this.notifyListeners("ReceiveMessage", message);
    });

    // Handle message sent confirmation
    this.connection.on("MessageSent", (message: any) => {
      console.log('[SignalR] Message sent:', message);
      this.notifyListeners("MessageSent", message);
    });

    // Handle message errors
    this.connection.on("MessageError", (error: string) => {
      console.error('[SignalR] Message error:', error);
      this.notifyListeners("MessageError", error);
    });

    // Handle typing indicators
    this.connection.on("UserTyping", (data: { userId: string; userName: string; threadId: string }) => {
      this.notifyListeners("UserTyping", data);
    });

    // Handle message read receipts
    this.connection.on("MessageRead", (messageId: string) => {
      this.notifyListeners("MessageRead", messageId);
    });

    // Handle connection state changes
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Reconnecting...', error);
      this.notifyListeners("Reconnecting", error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('[SignalR] Reconnected:', connectionId);
      this.notifyListeners("Reconnected", connectionId);
    });

    this.connection.onclose((error) => {
      console.error('[SignalR] Connection closed:', error);
      this.notifyListeners("ConnectionClosed", error);
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.listeners.clear();
      console.log('[SignalR] Disconnected');
    }
  }

  async joinThread(threadId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      // Validate threadId is a valid GUID before calling
      if (!threadId || threadId === '00000000-0000-0000-0000-000000000000') {
        console.warn('[SignalR] Invalid threadId provided to JoinThread:', threadId);
        return;
      }
      
      try {
        // Ensure threadId is a valid GUID string
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(threadId)) {
          console.warn('[SignalR] threadId is not a valid GUID:', threadId);
          return;
        }
        
        await this.connection.invoke("JoinThread", threadId);
        console.log('[SignalR] Joined thread:', threadId);
      } catch (error) {
        console.error('[SignalR] Failed to join thread:', threadId, error);
        throw error;
      }
    }
  }

  async leaveThread(threadId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("LeaveThread", threadId);
    }
  }

  async sendTypingIndicator(threadId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("UserTyping", threadId);
    }
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
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

}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;

