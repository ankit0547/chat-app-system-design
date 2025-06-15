import { ChatClient } from "./client";

// chatManager.ts
let chatClientInstance: ChatClient | null = null;
const SERVER_URL = "ws://localhost:7800";

export function createChatClient(token: string): ChatClient {
  if (chatClientInstance) {
    chatClientInstance.disconnect(); // cleanup
  }
  if (!token) {
    throw new Error("Token is required to create a ChatClient.");
  }
  chatClientInstance = new ChatClient(SERVER_URL, token);

  return chatClientInstance;
}

export function getChatClient(): ChatClient | null {
  return chatClientInstance;
}
