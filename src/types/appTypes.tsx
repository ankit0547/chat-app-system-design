// Define RootState type for Redux state
interface AppStateType {
  DashboardStates: {
    allChats: [];
    selectedChat: number | null;
  };
}

// Define the type for a chat object
type ChatType = {
  id: number;
  name: string;
  isGroup: boolean;
  time: string;
  lastMessage: string;
  unread: number;
};

export type { AppStateType, ChatType };
