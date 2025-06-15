import { createAction } from "@reduxjs/toolkit";
import { ChatClient } from "../../websocket/client";

export const connectChat = createAction<{ serverUrl: string; token: string }>(
  "chat/connect"
);
export const disconnectChat = createAction("chat/disconnect");
export const chatConnected = createAction("chat/connected");
export const chatDisconnected = createAction("chat/disconnected");
export const presence = createAction<unknown>("chat/presence");

export const sendMessage = createAction<{
  conversationId: string;
  content: string;
}>("chat/sendMessage");

export const sendTypingIndicator = createAction<{
  conversationId: string;
  isTyping: boolean;
}>("chat/sendTyping");

export const sendReadReceipt = createAction<{ messageId: string }>(
  "chat/sendReadReceipt"
);

export const setChatClient = createAction<ChatClient>("chat/setChatClient");
