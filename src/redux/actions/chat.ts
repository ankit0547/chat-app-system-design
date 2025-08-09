import { createAction } from "@reduxjs/toolkit";
import { ChatClient } from "../../websocket/client";
import { Conversation } from "../../types/types";

export const connectChat = createAction<{ token: string }>("chat/connect");
export const disconnectChat = createAction("chat/disconnect");
export const chatConnected = createAction("chat/connected");
export const chatDisconnected = createAction("chat/disconnected");
export const updateUserPresence = createAction<{
  userId: string;
  status: string;
  timestamp: number;
}>("chat/updateUserPresence");

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

export const getUserConversations = createAction("chat/getUserConversations");
export const setUserConversations = createAction<Conversation[]>(
  "chat/setUserConversations"
);
export const setUserConversationsTest = createAction<Conversation[]>(
  "chat/setUserConversationsTest"
);
export const setSelectedConversations = createAction<string>(
  "chat/setSelectedConversations"
);
