import * as signalR from "@microsoft/signalr";
import { getAuthUser } from "./auth/session";

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
      const userId = this.generateUserIdFromEmail(userEmail);

      // Build connection URL through proxy
      const hubUrl = `/api/proxy/messaging/messageHub`;
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          // Tokens are handled server-side by proxy - no need for accessTokenFactory
          // The proxy will inject the Authorization header from Redis
          accessTokenFactory: async () => {
            // Return empty - proxy handles authentication
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
      console.error('[SignalR] Connection error:', error);
      this.reconnectAttempts++;
      throw error;
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

  private generateUserIdFromEmail(email: string): string {
    // Simple hash function to generate consistent ID from email
    // This should match the backend logic
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;

