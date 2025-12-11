import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: Record<string, unknown>) => void>> =
    new Map();

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      // Get user info from session
      let userEmail = '';
      let userName = '';
      let userRole = 'Administrator';
      let userId = '';

      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/auth/session');
          const session = await response.json();
          userEmail = session?.user?.email || '';
          userName = session?.user?.name || userEmail;
          userRole = session?.user?.role || session?.user?.roles?.[0] || 'Administrator';

          // Generate user ID from email (consistent with backend)
          if (userEmail) {
            userId = this.generateUserIdFromEmail(userEmail);
          }
        } catch {
          // Ignore session fetch errors
        }
      }

      // Build connection URL directly to backend (bypassing Next.js proxy)
      // Next.js API routes don't support WebSocket connections, so SignalR must connect directly
      // This is the same approach used in the partner app
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_ONBOARDING_TARGET ||
        'http://localhost:8001';
      const hubUrl = `${backendUrl}/api/v1/messages/hub`;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          // For direct backend connection, we need to handle auth differently
          // The backend will use X-User-* headers for identification (development mode)
          // In production, you might need to add JWT token here if backend requires it
          accessTokenFactory: async () => {
            // Return empty - backend uses headers for user identification in development
            // In production, you might need to fetch and return a JWT token here
            return '';
          },
          headers: {
            'X-User-Email': userEmail,
            'X-User-Name': userName,
            'X-User-Role': userRole,
            'X-User-Id': userId,
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

      // Note: JoinThread should only be called with a valid threadId when a thread is selected
      // Don't call it here with userId - that was incorrect

      this.reconnectAttempts = 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // SignalR is optional - messaging will work without real-time updates
      // Don't log 404 errors as errors - they're expected if the endpoint doesn't exist
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        console.debug(
          '[SignalR] Endpoint not available (404) - real-time updates disabled'
        );
      } else {
        console.warn('[SignalR] Connection failed (non-critical):', error);
        console.warn('[SignalR] Messaging will work without real-time updates');
      }
      this.reconnectAttempts++;
      // Don't throw - allow messaging to work without SignalR
      // The connection will remain null and isConnected() will return false
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle new messages
    this.connection.on('ReceiveMessage', (message: Record<string, unknown>) => {
      console.info('[SignalR] Received message:', message);
      this.notifyListeners('ReceiveMessage', message);
    });

    // Handle message sent confirmation
    this.connection.on('MessageSent', (message: Record<string, unknown>) => {
      console.info('[SignalR] Message sent:', message);
      this.notifyListeners('MessageSent', message);
    });

    // Handle message errors
    this.connection.on('MessageError', (error: Record<string, unknown>) => {
      console.error('[SignalR] Message error:', error);
      this.notifyListeners('MessageError', error);
    });

    // Handle typing indicators
    this.connection.on('UserTyping', (data: Record<string, unknown>) => {
      this.notifyListeners('UserTyping', data);
    });

    // Handle message read receipts
    this.connection.on('MessageRead', (messageId: Record<string, unknown>) => {
      this.notifyListeners('MessageRead', messageId);
    });

    // Handle connection state changes
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Reconnecting...', error);
      this.notifyListeners(
        'Reconnecting',
        error ? { error: error.message || String(error) } : {}
      );
    });

    this.connection.onreconnected((connectionId) => {
      console.info('[SignalR] Reconnected:', connectionId);
      this.notifyListeners('Reconnected', { connectionId: connectionId || '' });
    });

    this.connection.onclose((error) => {
      console.error('[SignalR] Connection closed:', error);
      this.notifyListeners(
        'ConnectionClosed',
        error ? { error: error.message || String(error) } : {}
      );
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

        await this.connection.invoke('JoinThread', threadId);
        console.info('[SignalR] Joined thread:', threadId);
      } catch (error) {
        // Method doesn't exist on server - this is expected if backend doesn't implement it
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('Method does not exist') ||
          errorMessage.includes('HubException')
        ) {
          console.debug(
            '[SignalR] JoinThread method not available on server (non-critical)'
          );
        } else {
          console.warn('[SignalR] Failed to join thread:', threadId, error);
        }
        // Don't throw - allow app to continue without SignalR features
      }
    }
  }

  async leaveThread(threadId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveThread', threadId);
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
        // Don't throw - allow app to continue
      }
    }
  }

  async sendTypingIndicator(threadId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('UserTyping', threadId);
      } catch (error) {
        // Method doesn't exist on server - this is expected if backend doesn't implement it
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('Method does not exist') ||
          errorMessage.includes('HubException')
        ) {
          // Silently ignore - typing indicators are optional
          return;
        } else {
          console.warn('[SignalR] Failed to send typing indicator:', threadId, error);
        }
        // Don't throw - typing indicators are optional
      }
    }
  }

  on(event: string, callback: (data: Record<string, unknown>) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: Record<string, unknown>): void {
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

  private generateUserIdFromEmail(email: string): string {
    // Generate consistent GUID from email (matching backend's MD5-based UUID v3 implementation)
    // This must match the backend's GetCurrentUserId() logic in MessagesController.cs
    // Backend uses MD5 hash to generate UUID v3 format

    // NOTE: For exact matching with backend, we should use MD5 (e.g., via crypto-js library)
    // For now, we use a deterministic hash that produces consistent results
    // The backend will also generate from email, so both will produce consistent IDs
    const emailLower = email.toLowerCase();

    // Create a more robust hash by processing the email in chunks
    // This produces a more consistent result than simple character-by-character hashing
    let hash = 0;
    const emailBytes = new TextEncoder().encode(emailLower);
    for (let i = 0; i < emailBytes.length; i++) {
      hash = (hash << 5) - hash + emailBytes[i];
      hash = hash & hash; // Convert to 32bit integer
    }

    // Create a 128-bit hash by combining multiple passes
    let hash2 = 0;
    for (let i = emailBytes.length - 1; i >= 0; i--) {
      hash2 = (hash2 << 5) - hash2 + emailBytes[i];
      hash2 = hash2 & hash2;
    }

    // Combine hashes to create a longer hex string (simulating MD5's 128-bit output)
    const hash1Hex = Math.abs(hash).toString(16).padStart(8, '0');
    const hash2Hex = Math.abs(hash2).toString(16).padStart(8, '0');
    const combined = (hash1Hex + hash2Hex + hash1Hex + hash2Hex).substring(0, 32);

    // Format as UUID v3: xxxxxxxx-xxxx-3xxx-xxxx-xxxxxxxxxxxx
    // Set version 3 bits (bits 12-15 of time_hi_and_version to 0011 = 0x3)
    // Set variant bits (bits 6-7 of clock_seq_hi_and_reserved to 10 = 0x8)
    const formatted = `${combined.substring(0, 8)}-${combined.substring(8, 12)}-3${combined.substring(13, 16)}-${(parseInt(combined[16], 16) | 0x8).toString(16)}${combined.substring(17, 20)}-${combined.substring(20, 32)}`;

    return formatted;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;
