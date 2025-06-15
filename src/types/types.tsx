import { ChatClient } from "../websocket/client";

export interface ChatState {
  isConnected: boolean;
  client: ChatClient | null;
}
export interface AuthState {
  serverErrors: string[];
}
export interface ReduxState {
  app: {
    redirectPath: string | null;
    token: string | null;
  };
}
