/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// / client.ts
export class ChatClient {
  private socket: WebSocket | null = null;
  private token: string;
  private shouldReconnect = true; // ✅ Add this flag
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();
  private lastMessageId: string | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(serverUrl: string, token: string) {
    this.serverUrl = serverUrl;
    this.token = token;
  }

  connect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log("Socket already connected, skipping reconnect");
      return;
    }

    this.shouldReconnect = true; // ✅ allow reconnect initially
    const url = `${this.serverUrl}?token=${this.token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("Connected to WebSocket server");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit("connected");

      // If we have a last message ID, send it to get missed messages
      if (this.lastMessageId) {
        this.socket?.send(
          JSON.stringify({
            type: "sync",
            lastMessageId: this.lastMessageId,
          })
        );
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Update last message ID if this is a new message
        if (message.type === "new_message" && message.message?._id) {
          this.lastMessageId = message.message._id;
        }

        // Emit event based on message type
        this.emit(message.type, message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this.emit("disconnected", { code: event.code, reason: event.reason });

      // Attempt to reconnect
      if (this.shouldReconnect) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit("error", error);
    };
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnect attempts reached");
      this.emit("reconnect_failed");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      30000,
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
    );

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  disconnect(): void {
    this.shouldReconnect = false; // ✅ block reconnects
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.socket?.close(1000, "Client disconnected by user");
    this.socket = null;
  }

  sendMessage(
    conversationId: string,
    content: string,
    contentType: string = "text"
  ): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.emit("error", { message: "Not connected to server" });
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: "send_message",
        conversationId,
        content,
        contentType,
      })
    );
  }

  sendReadReceipt(messageId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: "read_receipt",
        messageId,
      })
    );
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: "typing_indicator",
        conversationId,
        isTyping,
      })
    );
  }

  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
