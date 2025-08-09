import { ChatClient } from "../websocket/client";

export interface ChatState {
  isConnected: boolean;
  client: ChatClient | null;
  allChats: Conversation[];
  selectedChat: Conversation | null;
  conversations: Conversation[];
  participantStatus: {
    [userId: string]: { isOnline: boolean; lastSeen: string };
  };
}
export interface AuthState {
  serverErrors: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    readBy: string[];
  }[];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: number;
}
export interface ReduxState {
  app: {
    redirectPath: string | null;
    token: string | null;
  };
}

export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: [];
}
